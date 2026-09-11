[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [string]$BackupFile,

    [string[]]$ExpectedTable = @(),

    [switch]$BackupOnly
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
$SourceDatabaseUrl = [Environment]::GetEnvironmentVariable('NOVA_BACKUP_SOURCE_DATABASE_URL', 'Process')
$RestoreDatabaseUrl = [Environment]::GetEnvironmentVariable('NOVA_BACKUP_RESTORE_DATABASE_URL', 'Process')
$RestoreTargetExclusiveApproval = [Environment]::GetEnvironmentVariable('NOVA_BACKUP_RESTORE_TARGET_EXCLUSIVE_APPROVAL', 'Process')
$script:ResolvedPostgresHostAddresses = @{}

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
    if ([string]::IsNullOrWhiteSpace($uri.Host) -or $uri.Host.Contains(',') -or [string]::IsNullOrWhiteSpace($databaseName) -or $databaseName.Contains('/')) {
        throw 'BLOCKED: the database URL must include one host and exactly one database path segment; multi-host URLs are not supported.'
    }

    if ($databaseName -notmatch '^[A-Za-z_][A-Za-z0-9_]*$') {
        throw 'BLOCKED: the database name must be a simple PostgreSQL identifier so it cannot override connection settings when passed to a client.'
    }

    $query = $uri.Query.TrimStart('?')
    if (-not [string]::IsNullOrWhiteSpace($query)) {
        foreach ($pair in $query.Split('&')) {
            $parts = $pair.Split('=', 2)
            if ($parts.Count -eq 0) {
                continue
            }

            $key = [Uri]::UnescapeDataString($parts[0]).ToLowerInvariant()
            if ($key -in @('host', 'hostaddr', 'port', 'service', 'servicefile', 'target_session_attrs')) {
                throw "BLOCKED: the database URL query parameter '$key' can change endpoint selection and is not supported."
            }
        }
    }

    try {
        $hostAddresses = [Net.Dns]::GetHostAddresses($uri.DnsSafeHost)
    }
    catch {
        throw 'BLOCKED: the database host could not be resolved to a stable address.'
    }

    if ($hostAddresses.Count -eq 0) {
        throw 'BLOCKED: the database host did not resolve to an address.'
    }

    $hostAddress = $hostAddresses[0].ToString()
    $script:ResolvedPostgresHostAddresses[$ConnectionUrl] = $hostAddress

    return [pscustomobject]@{
        Host        = $uri.Host.ToLowerInvariant()
        HostAddress = $hostAddress
        Port        = if ($uri.Port -gt 0) { $uri.Port } else { 5432 }
        Database    = $databaseName
    }
}

function Get-PostgresEnvironment {
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

    $userInfo = $uri.UserInfo -split ':', 2
    $databaseName = [Uri]::UnescapeDataString($uri.AbsolutePath.Trim('/'))
    if ([string]::IsNullOrWhiteSpace($uri.Host) -or $userInfo.Count -eq 0 -or [string]::IsNullOrWhiteSpace($userInfo[0]) -or [string]::IsNullOrWhiteSpace($databaseName) -or $databaseName.Contains('/')) {
        throw 'BLOCKED: the database URL must include a host, username, and exactly one database path segment.'
    }

    $hostAddress = $null
    if ($script:ResolvedPostgresHostAddresses.ContainsKey($ConnectionUrl)) {
        $hostAddress = $script:ResolvedPostgresHostAddresses[$ConnectionUrl]
    }
    else {
        try {
            $hostAddresses = [Net.Dns]::GetHostAddresses($uri.DnsSafeHost)
        }
        catch {
            throw 'BLOCKED: the database host could not be resolved to a stable address.'
        }

        if ($hostAddresses.Count -eq 0) {
            throw 'BLOCKED: the database host did not resolve to an address.'
        }

        $hostAddress = $hostAddresses[0].ToString()
        $script:ResolvedPostgresHostAddresses[$ConnectionUrl] = $hostAddress
    }

    $port = if ($uri.Port -gt 0) { $uri.Port } else { 5432 }
    $nullPasswordFile = if ([Environment]::OSVersion.Platform -eq [PlatformID]::Win32NT) { 'NUL' } else { '/dev/null' }
    $environment = @{
        PGHOST     = $uri.Host
        PGHOSTADDR = $hostAddress
        PGPORT     = [string]$port
        PGUSER     = [Uri]::UnescapeDataString($userInfo[0])
        PGDATABASE = $databaseName
        PGAPPNAME  = 'nova-ops-002-backup-verify'
        PGPASSFILE = $nullPasswordFile
        PGPASSWORD = $null
        PGOPTIONS  = $null
    }

    if ($userInfo.Count -eq 2) {
        $environment.PGPASSWORD = [Uri]::UnescapeDataString($userInfo[1])
    }

    $query = $uri.Query.TrimStart('?')
    if (-not [string]::IsNullOrWhiteSpace($query)) {
        foreach ($pair in $query.Split('&')) {
            $parts = $pair.Split('=', 2)
            if ($parts.Count -ne 2) {
                continue
            }

            $key = [Uri]::UnescapeDataString($parts[0]).ToLowerInvariant()
            $value = [Uri]::UnescapeDataString($parts[1])
            $environmentName = switch ($key) {
                'sslmode' { 'PGSSLMODE' }
                'sslrootcert' { 'PGSSLROOTCERT' }
                'sslcert' { 'PGSSLCERT' }
                'sslkey' { 'PGSSLKEY' }
                'gssencmode' { 'PGGSSENCMODE' }
                'channel_binding' { 'PGCHANNELBINDING' }
                'application_name' { 'PGAPPNAME' }
                default { $null }
            }

            if ($null -ne $environmentName) {
                $environment[$environmentName] = $value
            }
        }
    }

    return $environment
}

function Invoke-PostgresProcess {
    param(
        [Parameter(Mandatory = $true)]
        [string]$CommandPath,

        [Parameter(Mandatory = $true)]
        [string[]]$Arguments,

        [Parameter(Mandatory = $true)]
        [string]$DatabaseUrl,

        [Parameter(Mandatory = $true)]
        [string]$Description
    )

    $environment = Get-PostgresEnvironment -ConnectionUrl $DatabaseUrl
    $connectionEnvironmentNames = @(
        'PGHOST',
        'PGHOSTADDR',
        'PGPORT',
        'PGUSER',
        'PGPASSWORD',
        'PGDATABASE',
        'PGSERVICE',
        'PGSERVICEFILE',
        'PGAPPNAME',
        'PGCONNECT_TIMEOUT',
        'PGSSLMODE',
        'PGSSLROOTCERT',
        'PGSSLCERT',
        'PGSSLKEY',
        'PGSSLCRL',
        'PGSSLCRLDIR',
        'PGPASSFILE',
        'PGOPTIONS',
        'PGGSSENCMODE',
        'PGCHANNELBINDING',
        'PGTARGETSESSIONATTRS'
    )
    $previous = @{}
    foreach ($name in $connectionEnvironmentNames) {
        $previous[$name] = [Environment]::GetEnvironmentVariable($name, 'Process')
        [Environment]::SetEnvironmentVariable($name, $null, 'Process')
    }
    foreach ($name in $environment.Keys) {
        [Environment]::SetEnvironmentVariable($name, $environment[$name], 'Process')
    }

    try {
        $output = @(& $CommandPath @Arguments 2>&1)
        $exitCode = $LASTEXITCODE
    }
    finally {
        foreach ($name in $connectionEnvironmentNames) {
            [Environment]::SetEnvironmentVariable($name, $previous[$name], 'Process')
        }
    }

    if ($exitCode -ne 0) {
        throw "FAIL: $Description failed with exit code $exitCode."
    }

    return $output
}

function Invoke-PostgresCommand {
    param(
        [Parameter(Mandatory = $true)]
        [string]$CommandPath,

        [Parameter(Mandatory = $true)]
        [string[]]$Arguments,

        [Parameter(Mandatory = $true)]
        [string]$Description,

        [Parameter(Mandatory = $true)]
        [string]$DatabaseUrl
    )

    $null = Invoke-PostgresProcess `
        -CommandPath $CommandPath `
        -Arguments $Arguments `
        -DatabaseUrl $DatabaseUrl `
        -Description $Description
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

    $output = @(Invoke-PostgresProcess `
        -CommandPath $PsqlPath `
        -Arguments @('--tuples-only', '--no-align', '--no-psqlrc', '--no-password', '--set=ON_ERROR_STOP=1', "--command=$Query") `
        -DatabaseUrl $DatabaseUrl `
        -Description $Description)

    $value = $output |
        ForEach-Object { $_.ToString().Trim() } |
        Where-Object { $_ -ne '' } |
        Select-Object -First 1

    if ($null -eq $value) {
        throw "FAIL: $Description returned no value."
    }

    return $value
}

function Get-ConnectedDatabaseIdentity {
    param(
        [Parameter(Mandatory = $true)]
        [string]$PsqlPath,

        [Parameter(Mandatory = $true)]
        [string]$DatabaseUrl,

        [Parameter(Mandatory = $true)]
        [string]$Description
    )

    return Invoke-PostgresQuery `
        -PsqlPath $PsqlPath `
        -DatabaseUrl $DatabaseUrl `
        -Query "SELECT COALESCE(inet_server_addr()::text, 'local-socket') || ':' || COALESCE(inet_server_port()::text, '0') || ':' || current_database();" `
        -Description $Description
}

function Get-ConnectedServerIdentity {
    param(
        [Parameter(Mandatory = $true)]
        [string]$PsqlPath,

        [Parameter(Mandatory = $true)]
        [string]$DatabaseUrl,

        [Parameter(Mandatory = $true)]
        [string]$Description
    )

    return Invoke-PostgresQuery `
        -PsqlPath $PsqlPath `
        -DatabaseUrl $DatabaseUrl `
        -Query "SELECT COALESCE(inet_server_addr()::text, 'local-socket') || ':' || COALESCE(inet_server_port()::text, '0');" `
        -Description $Description
}

function Get-ConnectedClusterIdentity {
    param(
        [Parameter(Mandatory = $true)]
        [string]$PsqlPath,

        [Parameter(Mandatory = $true)]
        [string]$DatabaseUrl,

        [Parameter(Mandatory = $true)]
        [string]$Description
    )

    try {
        return Invoke-PostgresQuery `
            -PsqlPath $PsqlPath `
            -DatabaseUrl $DatabaseUrl `
            -Query 'SELECT system_identifier FROM pg_control_system();' `
            -Description $Description
    }
    catch {
        throw 'BLOCKED: PostgreSQL cluster identity could not be established; full restore verification requires access to pg_control_system().'
    }
}

function Assert-ConnectedDatabaseIdentity {
    param(
        [Parameter(Mandatory = $true)]
        [string]$PsqlPath,

        [Parameter(Mandatory = $true)]
        [string]$DatabaseUrl,

        [Parameter(Mandatory = $true)]
        [string]$ExpectedIdentity,

        [Parameter(Mandatory = $true)]
        [string]$Description
    )

    $actualIdentity = Get-ConnectedDatabaseIdentity `
        -PsqlPath $PsqlPath `
        -DatabaseUrl $DatabaseUrl `
        -Description $Description

    if ($actualIdentity -ne $ExpectedIdentity) {
        throw "BLOCKED: $Description changed between the approved identity check and the next operation."
    }
}

function Assert-ConnectedClusterIdentity {
    param(
        [Parameter(Mandatory = $true)]
        [string]$PsqlPath,

        [Parameter(Mandatory = $true)]
        [string]$DatabaseUrl,

        [Parameter(Mandatory = $true)]
        [string]$ExpectedIdentity,

        [Parameter(Mandatory = $true)]
        [string]$Description
    )

    $actualIdentity = Get-ConnectedClusterIdentity `
        -PsqlPath $PsqlPath `
        -DatabaseUrl $DatabaseUrl `
        -Description $Description

    if ($actualIdentity -ne $ExpectedIdentity) {
        throw "BLOCKED: $Description changed between the approved identity check and the next operation."
    }
}

function Get-UserObjectCount {
    param(
        [Parameter(Mandatory = $true)]
        [string]$PsqlPath,

        [Parameter(Mandatory = $true)]
        [string]$DatabaseUrl,

        [Parameter(Mandatory = $true)]
        [string]$Description
    )

    $query = @'
WITH user_namespaces AS (
    SELECT oid
    FROM pg_namespace
    WHERE nspname NOT IN ('pg_catalog', 'information_schema', 'pg_toast')
),
catalog_counts AS (
    SELECT count(*) AS object_count FROM pg_class AS c WHERE c.relnamespace IN (SELECT oid FROM user_namespaces)
    UNION ALL SELECT count(*) FROM pg_proc AS p WHERE p.pronamespace IN (SELECT oid FROM user_namespaces)
    UNION ALL SELECT count(*) FROM pg_type AS t WHERE t.typnamespace IN (SELECT oid FROM user_namespaces)
    UNION ALL SELECT count(*) FROM pg_collation AS c WHERE c.collnamespace IN (SELECT oid FROM user_namespaces)
    UNION ALL SELECT count(*) FROM pg_conversion AS c WHERE c.connamespace IN (SELECT oid FROM user_namespaces)
    UNION ALL SELECT count(*) FROM pg_operator AS o WHERE o.oprnamespace IN (SELECT oid FROM user_namespaces)
    UNION ALL SELECT count(*) FROM pg_opclass AS o WHERE o.opcnamespace IN (SELECT oid FROM user_namespaces)
    UNION ALL SELECT count(*) FROM pg_opfamily AS o WHERE o.opfnamespace IN (SELECT oid FROM user_namespaces)
    UNION ALL SELECT count(*) FROM pg_ts_config AS c WHERE c.cfgnamespace IN (SELECT oid FROM user_namespaces)
    UNION ALL SELECT count(*) FROM pg_ts_dict AS d WHERE d.dictnamespace IN (SELECT oid FROM user_namespaces)
    UNION ALL SELECT count(*) FROM pg_ts_parser AS p WHERE p.prsnamespace IN (SELECT oid FROM user_namespaces)
    UNION ALL SELECT count(*) FROM pg_ts_template AS t WHERE t.tmplnamespace IN (SELECT oid FROM user_namespaces)
    UNION ALL SELECT count(*) FROM pg_statistic_ext AS s WHERE s.stxnamespace IN (SELECT oid FROM user_namespaces)
    UNION ALL SELECT count(*) FROM pg_namespace WHERE oid IN (SELECT oid FROM user_namespaces) AND nspname <> 'public'
    UNION ALL SELECT count(*) FROM pg_extension WHERE extname <> 'plpgsql'
    UNION ALL SELECT count(*) FROM pg_event_trigger
    UNION ALL SELECT count(*) FROM pg_publication
    UNION ALL SELECT count(*) FROM pg_subscription
    UNION ALL SELECT count(*) FROM pg_largeobject_metadata
    UNION ALL SELECT count(*) FROM pg_default_acl
    UNION ALL SELECT count(*) FROM pg_db_role_setting
    UNION ALL SELECT count(*) FROM pg_parameter_acl
    UNION ALL SELECT count(*) FROM pg_seclabel
    UNION ALL SELECT count(*) FROM pg_language WHERE lanname NOT IN ('internal', 'c', 'sql', 'plpgsql')
)
SELECT COALESCE(sum(object_count), 0) FROM catalog_counts;
'@

    return Invoke-PostgresQuery `
        -PsqlPath $PsqlPath `
        -DatabaseUrl $DatabaseUrl `
        -Query $query `
        -Description $Description
}

try {
    if ([string]::IsNullOrWhiteSpace($SourceDatabaseUrl)) {
        throw 'BLOCKED: set NOVA_BACKUP_SOURCE_DATABASE_URL in the current process environment.'
    }

    if (-not $BackupOnly -and [string]::IsNullOrWhiteSpace($RestoreDatabaseUrl)) {
        throw 'BLOCKED: set NOVA_BACKUP_RESTORE_DATABASE_URL to an authorized empty disposable database, or pass -BackupOnly for archive-only validation.'
    }

    if (-not $BackupOnly -and $RestoreTargetExclusiveApproval -ne 'approved') {
        throw 'BLOCKED: set NOVA_BACKUP_RESTORE_TARGET_EXCLUSIVE_APPROVAL=approved only after placing the restore target under exclusive maintenance ownership for this drill.'
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

    $temporaryBackupPath = "$backupPath.partial.$([Guid]::NewGuid().ToString('N'))"

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

        if ([StringComparer]::OrdinalIgnoreCase.Equals($source.Database, $restore.Database)) {
            throw 'BLOCKED: the restore target must use a different database name from the source database.'
        }

        $sourceConnectionIdentity = Get-ConnectedDatabaseIdentity `
            -PsqlPath $psqlPath `
            -DatabaseUrl $SourceDatabaseUrl `
            -Description 'source database identity check'
        $restoreConnectionIdentity = Get-ConnectedDatabaseIdentity `
            -PsqlPath $psqlPath `
            -DatabaseUrl $RestoreDatabaseUrl `
            -Description 'restore-target identity check'

        $sourceServerIdentity = Get-ConnectedServerIdentity `
            -PsqlPath $psqlPath `
            -DatabaseUrl $SourceDatabaseUrl `
            -Description 'source server identity check'
        $restoreServerIdentity = Get-ConnectedServerIdentity `
            -PsqlPath $psqlPath `
            -DatabaseUrl $RestoreDatabaseUrl `
            -Description 'restore-target server identity check'

        $sourceClusterIdentity = Get-ConnectedClusterIdentity `
            -PsqlPath $psqlPath `
            -DatabaseUrl $SourceDatabaseUrl `
            -Description 'source cluster identity check'
        $restoreClusterIdentity = Get-ConnectedClusterIdentity `
            -PsqlPath $psqlPath `
            -DatabaseUrl $RestoreDatabaseUrl `
            -Description 'restore-target cluster identity check'

        if ($sourceServerIdentity -eq $restoreServerIdentity) {
            throw 'BLOCKED: the restore target must be on a separate PostgreSQL server or cluster endpoint from the source.'
        }

        if ($sourceClusterIdentity -eq $restoreClusterIdentity) {
            throw 'BLOCKED: the restore target is in the same PostgreSQL cluster as the source.'
        }

        if ($sourceConnectionIdentity -eq $restoreConnectionIdentity) {
            throw 'BLOCKED: the restore target has the same connected server and database identity as the source.'
        }

        $existingObjectCountText = Get-UserObjectCount `
            -PsqlPath $psqlPath `
            -DatabaseUrl $RestoreDatabaseUrl `
            -Description 'restore-target user-object emptiness check'

        [long]$existingObjectCount = 0
        if (-not [long]::TryParse($existingObjectCountText, [Globalization.NumberStyles]::Integer, [Globalization.CultureInfo]::InvariantCulture, [ref]$existingObjectCount)) {
            throw 'FAIL: restore-target emptiness check returned a non-numeric user-object count.'
        }

        if ($existingObjectCount -ne 0) {
            throw 'BLOCKED: the restore target already contains user database objects; the verifier requires a genuinely empty target and will not overwrite or clean it.'
        }
    }

    if (-not $BackupOnly) {
        Assert-ConnectedDatabaseIdentity `
            -PsqlPath $psqlPath `
            -DatabaseUrl $SourceDatabaseUrl `
            -ExpectedIdentity $sourceConnectionIdentity `
            -Description 'source database identity check before backup'
        Assert-ConnectedClusterIdentity `
            -PsqlPath $psqlPath `
            -DatabaseUrl $SourceDatabaseUrl `
            -ExpectedIdentity $sourceClusterIdentity `
            -Description 'source cluster identity check before backup'
    }

    Write-Event -Status 'RUNNING' -Phase 'backup' -Message 'Creating a PostgreSQL custom-format archive from the source database.'
    Invoke-PostgresCommand `
        -CommandPath $pgDumpPath `
        -Arguments @("--dbname=$($source.Database)", '--format=custom', "--file=$temporaryBackupPath", '--no-owner', '--no-acl', '--no-password') `
        -Description 'PostgreSQL backup' `
        -DatabaseUrl $SourceDatabaseUrl

    if (-not $BackupOnly) {
        Assert-ConnectedDatabaseIdentity `
            -PsqlPath $psqlPath `
            -DatabaseUrl $SourceDatabaseUrl `
            -ExpectedIdentity $sourceConnectionIdentity `
            -Description 'source database identity check after backup'
        Assert-ConnectedClusterIdentity `
            -PsqlPath $psqlPath `
            -DatabaseUrl $SourceDatabaseUrl `
            -ExpectedIdentity $sourceClusterIdentity `
            -Description 'source cluster identity check after backup'
    }

    if (-not (Test-Path -LiteralPath $temporaryBackupPath -PathType Leaf)) {
        throw 'FAIL: pg_dump completed but did not create the temporary backup archive.'
    }

    $backupInfo = Get-Item -LiteralPath $temporaryBackupPath
    if ($backupInfo.Length -le 0) {
        throw 'FAIL: pg_dump created an empty temporary backup archive.'
    }

    $archiveEntries = @(& $pgRestorePath '--list' $temporaryBackupPath 2>&1)
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

    $sha256 = (Get-FileHash -Algorithm SHA256 -LiteralPath $temporaryBackupPath).Hash.ToLowerInvariant()
    try {
        [IO.File]::Move($temporaryBackupPath, $backupPath)
    }
    catch {
        throw 'BLOCKED: could not publish the backup archive atomically because the final path became unavailable or already exists.'
    }

    $backupInfo = Get-Item -LiteralPath $backupPath
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

    Assert-ConnectedDatabaseIdentity `
        -PsqlPath $psqlPath `
        -DatabaseUrl $RestoreDatabaseUrl `
        -ExpectedIdentity $restoreConnectionIdentity `
        -Description 'restore-target identity check before restore'
    Assert-ConnectedClusterIdentity `
        -PsqlPath $psqlPath `
        -DatabaseUrl $RestoreDatabaseUrl `
        -ExpectedIdentity $restoreClusterIdentity `
        -Description 'restore-target cluster identity check before restore'

    $existingObjectCountText = Get-UserObjectCount `
        -PsqlPath $psqlPath `
        -DatabaseUrl $RestoreDatabaseUrl `
        -Description 'restore-target emptiness check before restore'
    [long]$existingObjectCount = 0
    if (-not [long]::TryParse($existingObjectCountText, [Globalization.NumberStyles]::Integer, [Globalization.CultureInfo]::InvariantCulture, [ref]$existingObjectCount)) {
        throw 'FAIL: restore-target emptiness check returned a non-numeric user-object count.'
    }

    if ($existingObjectCount -ne 0) {
        throw 'BLOCKED: the restore target gained user database objects before restore; the approved maintenance window is no longer valid.'
    }

    Write-Event -Status 'RUNNING' -Phase 'restore' -Message 'Restoring the archive into the operator-approved target database.'
    Invoke-PostgresCommand `
        -CommandPath $pgRestorePath `
        -Arguments @("--dbname=$($restore.Database)", '--format=custom', '--exit-on-error', '--single-transaction', '--no-owner', '--no-acl', '--no-password', $backupPath) `
        -Description 'PostgreSQL restore' `
        -DatabaseUrl $RestoreDatabaseUrl

    Assert-ConnectedDatabaseIdentity `
        -PsqlPath $psqlPath `
        -DatabaseUrl $RestoreDatabaseUrl `
        -ExpectedIdentity $restoreConnectionIdentity `
        -Description 'restore-target identity check after restore'
    Assert-ConnectedClusterIdentity `
        -PsqlPath $psqlPath `
        -DatabaseUrl $RestoreDatabaseUrl `
        -ExpectedIdentity $restoreClusterIdentity `
        -Description 'restore-target cluster identity check after restore'

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
        -Message 'Backup archive creation, structural verification, and separate-cluster restore verification passed under operator-approved target maintenance.' `
        -Data ([ordered]@{
            restore                    = 'PASS'
            restoredTables             = $restoredTableCount
            expectedTables             = @($ExpectedTable)
            archivePath                = $backupPath
            archiveBytes               = $backupInfo.Length
            sha256                     = $sha256
            sourceClusterIdentity      = $sourceClusterIdentity
            restoreClusterIdentity     = $restoreClusterIdentity
            targetMaintenanceApproval  = 'approved'
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
