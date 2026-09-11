[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [string]$BackupFile,

    [string]$SourceDatabaseUrl = $env:NOVA_BACKUP_SOURCE_DATABASE_URL,

    [string]$RestoreDatabaseUrl = $env:NOVA_BACKUP_RESTORE_DATABASE_URL,

    [string[]]$ExpectedTable = @(),

    [switch]$BackupOnly
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Write-Event {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Status,

        [Parameter(Mandatory = $true)]
        [string]$Phase,

        [Parameter(Mandatory = $true)]
        [string]$Message,

        [object]$Data = $null
    )

    $event = [ordered]@{
        status  = $Status
        phase   = $Phase
        message = $Message
    }

    if ($null -ne $Data) {
        $event.data = $Data
    }

    [Console]::Out.WriteLine(($event | ConvertTo-Json -Compress -Depth 6))
}

function Get-RequiredCommandPath {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Name
    )

    $command = Get-Command $Name -CommandType Application -ErrorAction SilentlyContinue
    if ($null -eq $command) {
        throw "BLOCKED: PostgreSQL client command '$Name' was not found on PATH."
    }

    return $command.Source
}

function Get-DatabaseIdentity {
    param(
        [Parameter(Mandatory = $true)]
        [string]$ConnectionUrl
    )

    try {
        $uri = [Uri]$ConnectionUrl
    }
    catch {
        throw 'BLOCKED: the PostgreSQL connection URL is not a valid URI.'
    }

    if ($uri.Scheme -notin @('postgresql', 'postgres')) {
        throw 'BLOCKED: the database URL must use the postgresql or postgres scheme.'
    }

    $databaseName = [Uri]::UnescapeDataString($uri.AbsolutePath.Trim('/'))
    if ([string]::IsNullOrWhiteSpace($uri.Host) -or [string]::IsNullOrWhiteSpace($databaseName) -or $databaseName.Contains('/')) {
        throw 'BLOCKED: the database URL must include a host and exactly one database path segment.'
    }

    return [pscustomobject]@{
        Host     = $uri.Host.ToLowerInvariant()
        Port     = if ($uri.Port -gt 0) { $uri.Port } else { 5432 }
        Database = $databaseName
    }
}

function Invoke-PostgresCommand {
    param(
        [Parameter(Mandatory = $true)]
        [string]$CommandPath,

        [Parameter(Mandatory = $true)]
        [string[]]$Arguments,

        [Parameter(Mandatory = $true)]
        [string]$Description
    )

    $null = & $CommandPath @Arguments 2>&1
    if ($LASTEXITCODE -ne 0) {
        throw "FAIL: $Description failed with exit code $LASTEXITCODE."
    }
}

function Invoke-PostgresQuery {
    param(
        [Parameter(Mandatory = $true)]
        [string]$PsqlPath,

        [Parameter(Mandatory = $true)]
        [string]$DatabaseUrl,

        [Parameter(Mandatory = $true)]
        [string]$Query,

        [Parameter(Mandatory = $true)]
        [string]$Description
    )

    $output = @(& $PsqlPath "--dbname=$DatabaseUrl" '--tuples-only' '--no-align' '--no-psqlrc' "--command=$Query" 2>&1)
    if ($LASTEXITCODE -ne 0) {
        throw "FAIL: $Description failed with exit code $LASTEXITCODE."
    }

    $value = $output |
        ForEach-Object { $_.ToString().Trim() } |
        Where-Object { $_ -ne '' } |
        Select-Object -First 1

    if ($null -eq $value) {
        throw "FAIL: $Description returned no value."
    }

    return $value
}

try {
    if ([string]::IsNullOrWhiteSpace($SourceDatabaseUrl)) {
        throw 'BLOCKED: set NOVA_BACKUP_SOURCE_DATABASE_URL in the current process environment.'
    }

    if (-not $BackupOnly -and [string]::IsNullOrWhiteSpace($RestoreDatabaseUrl)) {
        throw 'BLOCKED: set NOVA_BACKUP_RESTORE_DATABASE_URL to an authorized empty disposable database, or pass -BackupOnly for archive-only validation.'
    }

    $source = Get-DatabaseIdentity -ConnectionUrl $SourceDatabaseUrl
    $backupPath = [IO.Path]::GetFullPath($BackupFile)
    $backupDirectory = [IO.Path]::GetDirectoryName($backupPath)

    if ([string]::IsNullOrWhiteSpace($backupDirectory) -or -not (Test-Path -LiteralPath $backupDirectory -PathType Container)) {
        throw 'BLOCKED: the backup output directory does not exist.'
    }

    if (Test-Path -LiteralPath $backupPath) {
        throw 'BLOCKED: the backup output file already exists; choose a new path to prevent accidental overwrite.'
    }

    foreach ($table in @($ExpectedTable)) {
        if ([string]::IsNullOrWhiteSpace($table) -or $table -notmatch '^[A-Za-z_][A-Za-z0-9_]*$') {
            throw "BLOCKED: expected table '$table' is not a simple PostgreSQL identifier."
        }
    }

    $pgDumpPath = Get-RequiredCommandPath -Name 'pg_dump'
    $pgRestorePath = Get-RequiredCommandPath -Name 'pg_restore'
    $psqlPath = Get-RequiredCommandPath -Name 'psql'

    if (-not $BackupOnly) {
        $restore = Get-DatabaseIdentity -ConnectionUrl $RestoreDatabaseUrl
        if ($source.Host -eq $restore.Host -and $source.Port -eq $restore.Port -and $source.Database -eq $restore.Database) {
            throw 'BLOCKED: the restore target resolves to the source database; a separate target is required.'
        }

        $existingTableCountText = Invoke-PostgresQuery `
            -PsqlPath $psqlPath `
            -DatabaseUrl $RestoreDatabaseUrl `
            -Query "SELECT count(*) FROM pg_class AS c JOIN pg_namespace AS n ON n.oid = c.relnamespace WHERE n.nspname NOT IN ('pg_catalog', 'information_schema') AND c.relkind IN ('r', 'p');" `
            -Description 'restore-target emptiness check'

        [long]$existingTableCount = 0
        if (-not [long]::TryParse($existingTableCountText, [Globalization.NumberStyles]::Integer, [Globalization.CultureInfo]::InvariantCulture, [ref]$existingTableCount)) {
            throw 'FAIL: restore-target emptiness check returned a non-numeric table count.'
        }

        if ($existingTableCount -ne 0) {
            throw 'BLOCKED: the restore target already contains user tables; the verifier will not overwrite or clean it.'
        }
    }

    Write-Event -Status 'RUNNING' -Phase 'backup' -Message 'Creating a PostgreSQL custom-format archive from the source database.'
    Invoke-PostgresCommand `
        -CommandPath $pgDumpPath `
        -Arguments @("--dbname=$SourceDatabaseUrl", '--format=custom', "--file=$backupPath", '--no-owner', '--no-acl') `
        -Description 'PostgreSQL backup'

    if (-not (Test-Path -LiteralPath $backupPath -PathType Leaf)) {
        throw 'FAIL: pg_dump completed but did not create the backup archive.'
    }

    $backupInfo = Get-Item -LiteralPath $backupPath
    if ($backupInfo.Length -le 0) {
        throw 'FAIL: pg_dump created an empty backup archive.'
    }

    $archiveEntries = @(& $pgRestorePath '--list' $backupPath 2>&1)
    if ($LASTEXITCODE -ne 0) {
        throw 'FAIL: pg_restore archive listing failed; the archive is not structurally verifiable.'
    }

    $entryCount = @(
        $archiveEntries |
            ForEach-Object { $_.ToString().Trim() } |
            Where-Object { $_ -ne '' -and -not $_.StartsWith('#') -and -not $_.StartsWith(';') }
    ).Count

    if ($entryCount -le 0) {
        throw 'FAIL: pg_restore archive listing contained no data-definition or data entries.'
    }

    $sha256 = (Get-FileHash -Algorithm SHA256 -LiteralPath $backupPath).Hash.ToLowerInvariant()
    Write-Event `
        -Status 'PASS' `
        -Phase 'archive' `
        -Message 'The backup archive was created and structurally verified.' `
        -Data ([ordered]@{
            archivePath   = $backupPath
            archiveBytes  = $backupInfo.Length
            archiveEntries = $entryCount
            sha256        = $sha256
        })

    if ($BackupOnly) {
        Write-Event `
            -Status 'PASS' `
            -Phase 'complete' `
            -Message 'Archive-only verification passed; restore was intentionally not attempted.' `
            -Data ([ordered]@{ restore = 'SKIPPED' })
        exit 0
    }

    Write-Event -Status 'RUNNING' -Phase 'restore' -Message 'Restoring the archive into the preflighted empty target database.'
    Invoke-PostgresCommand `
        -CommandPath $pgRestorePath `
        -Arguments @("--dbname=$RestoreDatabaseUrl", '--format=custom', '--exit-on-error', '--single-transaction', '--no-owner', '--no-acl', $backupPath) `
        -Description 'PostgreSQL restore'

    $restoredTableCountText = Invoke-PostgresQuery `
        -PsqlPath $psqlPath `
        -DatabaseUrl $RestoreDatabaseUrl `
        -Query "SELECT count(*) FROM pg_class AS c JOIN pg_namespace AS n ON n.oid = c.relnamespace WHERE n.nspname NOT IN ('pg_catalog', 'information_schema') AND c.relkind IN ('r', 'p');" `
        -Description 'restored-table verification'

    [long]$restoredTableCount = 0
    if (-not [long]::TryParse($restoredTableCountText, [Globalization.NumberStyles]::Integer, [Globalization.CultureInfo]::InvariantCulture, [ref]$restoredTableCount)) {
        throw 'FAIL: restored-table verification returned a non-numeric table count.'
    }

    if ($restoredTableCount -le 0) {
        throw 'FAIL: restore completed but no user tables were found in the target database.'
    }

    foreach ($table in @($ExpectedTable)) {
        $tableExists = Invoke-PostgresQuery `
            -PsqlPath $psqlPath `
            -DatabaseUrl $RestoreDatabaseUrl `
            -Query "SELECT CASE WHEN to_regclass('public.""$table""') IS NULL THEN 0 ELSE 1 END;" `
            -Description "expected-table verification for '$table'"

        if ($tableExists -ne '1') {
            throw "FAIL: expected table '$table' was not found after restore."
        }
    }

    Write-Event `
        -Status 'PASS' `
        -Phase 'complete' `
        -Message 'Backup archive creation, structural verification, and isolated restore verification passed.' `
        -Data ([ordered]@{
            restore         = 'PASS'
            restoredTables  = $restoredTableCount
            expectedTables  = @($ExpectedTable)
            archivePath     = $backupPath
            archiveBytes    = $backupInfo.Length
            sha256          = $sha256
        })
    exit 0
}
catch {
    $message = $_.Exception.Message
    $status = if ($message.StartsWith('BLOCKED:')) { 'BLOCKED' } else { 'FAIL' }
    $exitCode = if ($status -eq 'BLOCKED') { 2 } else { 1 }
    Write-Event -Status $status -Phase 'complete' -Message $message
    exit $exitCode
}
