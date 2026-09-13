# Verifies the repository-owned local API, object-storage, Redis, and worker signals.
# This script is intentionally read-only: it sends health GETs, redis-cli ping,
# and the worker's SELECT 1 health command only. It never starts services or
# sends credentials/provider traffic.

[CmdletBinding()]
param (
    [string]$ApiOrigin,

    [string]$S3Origin,

    [switch]$CheckRedis,

    [string]$ComposeProjectName,

    [switch]$CheckWorker,

    [ValidateRange(1, 60)]
    [int]$TimeoutSec = 5
)

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version 3.0

$script:blocked = $false
$script:failed = $false
$repositoryRoot = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot '..\..')).Path

function Write-CheckResult {
    param (
        [Parameter(Mandatory)]
        [string]$Name,

        [Parameter(Mandatory)]
        [ValidateSet('PASS', 'BLOCKED', 'FAIL', 'NOT RUN')]
        [string]$Status,

        [Parameter(Mandatory)]
        [string]$Reason
    )

    Write-Host ('[{0}] {1}: {2}' -f $Status, $Name, $Reason)

    if ($Status -eq 'BLOCKED') {
        $script:blocked = $true
    }
    elseif ($Status -eq 'FAIL') {
        $script:failed = $true
    }
}

function Get-LocalOrigin {
    param (
        [Parameter(Mandatory)]
        [string]$SignalName,

        [Parameter(Mandatory)]
        [AllowEmptyString()]
        [string]$RawValue
    )

    if ([string]::IsNullOrWhiteSpace($RawValue)) {
        Write-CheckResult -Name $SignalName -Status 'BLOCKED' -Reason 'local origin is not configured.'
        return $null
    }

    try {
        $uri = [Uri]$RawValue
    }
    catch {
        Write-CheckResult -Name $SignalName -Status 'BLOCKED' -Reason 'local origin is not a valid absolute HTTP(S) URL.'
        return $null
    }

    if (
        -not $uri.IsAbsoluteUri -or
        @('http', 'https') -notcontains $uri.Scheme.ToLowerInvariant()
    ) {
        Write-CheckResult -Name $SignalName -Status 'BLOCKED' -Reason 'origin must be an absolute HTTP(S) URL.'
        return $null
    }

    $localHost = @('localhost', '127.0.0.1', '::1') -contains $uri.DnsSafeHost.ToLowerInvariant()
    if (
        -not $localHost -or
        -not [string]::IsNullOrEmpty($uri.UserInfo) -or
        -not [string]::IsNullOrEmpty($uri.Query) -or
        -not [string]::IsNullOrEmpty($uri.Fragment) -or
        ($uri.AbsolutePath -ne '/' -and -not [string]::IsNullOrEmpty($uri.AbsolutePath))
    ) {
        Write-CheckResult -Name $SignalName -Status 'BLOCKED' -Reason 'origin must be loopback-only HTTP(S) without credentials, path, query, or fragment.'
        return $null
    }

    return $uri.GetLeftPart([UriPartial]::Authority)
}

function Test-JsonPropertyValue {
    param (
        [AllowNull()]
        [object]$Payload,

        [Parameter(Mandatory)]
        [string]$PropertyName,

        [Parameter(Mandatory)]
        [string]$ExpectedValue
    )

    if ($null -eq $Payload) {
        return $false
    }

    $property = $Payload.PSObject.Properties[$PropertyName]
    return $null -ne $property -and $property.Value -eq $ExpectedValue
}

function Get-LocalDatabaseUrl {
    param (
        [Parameter(Mandatory)]
        [AllowNull()]
        [AllowEmptyString()]
        [string]$RawValue
    )

    if ([string]::IsNullOrWhiteSpace($RawValue)) {
        Write-CheckResult -Name 'worker health' -Status 'BLOCKED' -Reason 'DATABASE_URL is not configured for the optional worker check.'
        return $null
    }

    try {
        $uri = [Uri]$RawValue
    }
    catch {
        Write-CheckResult -Name 'worker health' -Status 'BLOCKED' -Reason 'DATABASE_URL is not a valid local PostgreSQL URL.'
        return $null
    }

    $scheme = $uri.Scheme.ToLowerInvariant()
    $databaseHost = $uri.DnsSafeHost.ToLowerInvariant().Replace('[', '').Replace(']', '')
    $localHost = @('localhost', '127.0.0.1', '::1') -contains $databaseHost
    if (
        -not $uri.IsAbsoluteUri -or
        @('postgres', 'postgresql') -notcontains $scheme -or
        -not $localHost -or
        [string]::IsNullOrEmpty($uri.AbsolutePath) -or
        $uri.AbsolutePath -eq '/' -or
        -not [string]::IsNullOrEmpty($uri.Fragment)
    ) {
        Write-CheckResult -Name 'worker health' -Status 'BLOCKED' -Reason 'DATABASE_URL must target a loopback PostgreSQL database without a fragment.'
        return $null
    }

    return $uri
}

function Invoke-LocalGet {
    param (
        [Parameter(Mandatory)]
        [string]$RequestUri
    )

    try {
        $response = Invoke-WebRequest `
            -UseBasicParsing `
            -Uri $RequestUri `
            -Method Get `
            -Headers @{ Accept = 'application/json' } `
            -MaximumRedirection 0 `
            -TimeoutSec $TimeoutSec `
            -ErrorAction Stop

        return [pscustomobject]@{
            Reachable = $true
            StatusCode = [int]$response.StatusCode
            Content = [string]$response.Content
        }
    }
    catch {
        $response = $_.Exception.Response
        if ($null -ne $response) {
            return [pscustomobject]@{
                Reachable = $true
                StatusCode = [int]$response.StatusCode
                Content = ''
            }
        }

        return [pscustomobject]@{
            Reachable = $false
            StatusCode = $null
            Content = ''
        }
    }
}

function Test-ApiHealth {
    param (
        [Parameter(Mandatory)]
        [string]$Origin,

        [Parameter(Mandatory)]
        [string]$Path,

        [Parameter(Mandatory)]
        [string]$SignalName,

        [Parameter(Mandatory)]
        [AllowEmptyString()]
        [string]$RequiredDatabaseState
    )

    $result = Invoke-LocalGet -RequestUri ($Origin + $Path)
    if (-not $result.Reachable) {
        Write-CheckResult -Name $SignalName -Status 'BLOCKED' -Reason 'loopback endpoint is unreachable.'
        return
    }

    if ($result.StatusCode -ne 200) {
        Write-CheckResult -Name $SignalName -Status 'FAIL' -Reason ('endpoint returned HTTP {0}.' -f $result.StatusCode)
        return
    }

    try {
        $payload = $result.Content | ConvertFrom-Json
    }
    catch {
        Write-CheckResult -Name $SignalName -Status 'FAIL' -Reason 'endpoint returned a non-JSON response.'
        return
    }

    $healthy =
        (Test-JsonPropertyValue -Payload $payload -PropertyName 'status' -ExpectedValue 'ok') -and
        (Test-JsonPropertyValue -Payload $payload -PropertyName 'service' -ExpectedValue 'api')
    if ($RequiredDatabaseState) {
        $healthy = $healthy -and (Test-JsonPropertyValue -Payload $payload -PropertyName 'database' -ExpectedValue $RequiredDatabaseState)
    }

    if ($healthy) {
        Write-CheckResult -Name $SignalName -Status 'PASS' -Reason 'contract response is healthy.'
    }
    else {
        Write-CheckResult -Name $SignalName -Status 'FAIL' -Reason 'response did not match the repository health contract.'
    }
}

function Test-ObjectStorageHealth {
    param (
        [Parameter(Mandatory)]
        [string]$Origin
    )

    $result = Invoke-LocalGet -RequestUri ($Origin + '/minio/health/live')
    if (-not $result.Reachable) {
        Write-CheckResult -Name 'object-storage liveness' -Status 'BLOCKED' -Reason 'loopback endpoint is unreachable.'
    }
    elseif ($result.StatusCode -eq 200) {
        Write-CheckResult -Name 'object-storage liveness' -Status 'PASS' -Reason 'endpoint returned HTTP 200.'
    }
    else {
        Write-CheckResult -Name 'object-storage liveness' -Status 'FAIL' -Reason ('endpoint returned HTTP {0}.' -f $result.StatusCode)
    }
}

function Test-RedisHealth {
    if (-not $CheckRedis) {
        Write-CheckResult -Name 'Redis connectivity' -Status 'NOT RUN' -Reason 'optional check was not requested.'
        return
    }

    if ([string]::IsNullOrWhiteSpace($ComposeProjectName)) {
        Write-CheckResult -Name 'Redis connectivity' -Status 'BLOCKED' -Reason 'Compose project name is required when Redis checking is requested.'
        return
    }

    if ($ComposeProjectName -notmatch '^[A-Za-z0-9][A-Za-z0-9_.-]{0,62}$') {
        Write-CheckResult -Name 'Redis connectivity' -Status 'BLOCKED' -Reason 'Compose project name contains unsupported characters.'
        return
    }

    if ($null -eq (Get-Command docker -ErrorAction SilentlyContinue)) {
        Write-CheckResult -Name 'Redis connectivity' -Status 'BLOCKED' -Reason 'Docker CLI is unavailable.'
        return
    }

    $dockerAvailable = $false
    $previousErrorActionPreference = $ErrorActionPreference
    try {
        $ErrorActionPreference = 'Continue'
        & docker compose version *> $null
        $dockerAvailable = $LASTEXITCODE -eq 0
    }
    catch {
        $dockerAvailable = $false
    }
    finally {
        $ErrorActionPreference = $previousErrorActionPreference
    }

    if (-not $dockerAvailable) {
        Write-CheckResult -Name 'Redis connectivity' -Status 'BLOCKED' -Reason 'Docker Compose is unavailable.'
        return
    }

    Push-Location -LiteralPath $repositoryRoot
    $previousErrorActionPreference = $ErrorActionPreference
    try {
        $ErrorActionPreference = 'Continue'
        $composeArguments = @(
            '--project-name', $ComposeProjectName,
            '--env-file', '.env.example',
            '-f', 'infra/docker/compose.yml',
            'exec', '-T', 'redis', 'redis-cli', 'ping'
        )
        $commandOutput = @(& docker compose @composeArguments 2>&1)
        $commandExitCode = $LASTEXITCODE
    }
    catch {
        Write-CheckResult -Name 'Redis connectivity' -Status 'BLOCKED' -Reason 'Docker Compose could not execute the fixed Redis health command.'
        return
    }
    finally {
        $ErrorActionPreference = $previousErrorActionPreference
        Pop-Location
    }

    $outputText = ($commandOutput | ForEach-Object { $_.ToString() }) -join "`n"
    $hasPong = @(
        $commandOutput | Where-Object { $_.ToString().Trim() -eq 'PONG' }
    ).Count -gt 0
    if ($commandExitCode -eq 0 -and $hasPong) {
        Write-CheckResult -Name 'Redis connectivity' -Status 'PASS' -Reason 'fixed redis-cli ping returned PONG.'
    }
    elseif (
        $commandExitCode -ne 0 -and
        $outputText -match '(?i)error during connect|access is denied|docker_engine|daemon|not running|no such service|could not connect|connection refused'
    ) {
        Write-CheckResult -Name 'Redis connectivity' -Status 'BLOCKED' -Reason 'Docker or the local Redis container is unavailable.'
    }
    else {
        Write-CheckResult -Name 'Redis connectivity' -Status 'FAIL' -Reason 'fixed redis-cli ping did not return PONG.'
    }
}

function Test-WorkerHealth {
    if (-not $CheckWorker) {
        Write-CheckResult -Name 'worker health' -Status 'NOT RUN' -Reason 'optional check was not requested.'
        return
    }

    if ($null -eq (Get-Command bun -ErrorAction SilentlyContinue)) {
        Write-CheckResult -Name 'worker health' -Status 'BLOCKED' -Reason 'Bun is unavailable.'
        return
    }

    $databaseUrl = Get-LocalDatabaseUrl -RawValue $env:DATABASE_URL
    if ($null -eq $databaseUrl) {
        return
    }

    Push-Location -LiteralPath $repositoryRoot
    $previousErrorActionPreference = $ErrorActionPreference
    try {
        $ErrorActionPreference = 'Continue'
        $commandOutput = @(& bun run --cwd apps/worker health 2>&1)
        $commandExitCode = $LASTEXITCODE
    }
    catch {
        Write-CheckResult -Name 'worker health' -Status 'BLOCKED' -Reason 'the repository worker health command could not be executed.'
        return
    }
    finally {
        $ErrorActionPreference = $previousErrorActionPreference
        Pop-Location
    }

    $healthEvent = $null
    foreach ($line in $commandOutput) {
        try {
            $candidate = $line.ToString() | ConvertFrom-Json
            if (
                (Test-JsonPropertyValue -Payload $candidate -PropertyName 'service' -ExpectedValue 'nova-worker') -and
                (Test-JsonPropertyValue -Payload $candidate -PropertyName 'event' -ExpectedValue 'worker_health') -and
                (Test-JsonPropertyValue -Payload $candidate -PropertyName 'status' -ExpectedValue 'ok')
            ) {
                $healthEvent = $candidate
                break
            }
        }
        catch {
            # Bun/package-manager diagnostics are intentionally ignored and never printed.
        }
    }

    if ($commandExitCode -eq 0 -and $null -ne $healthEvent) {
        Write-CheckResult -Name 'worker health' -Status 'PASS' -Reason 'repository health command returned the fixed worker_health ok event.'
    }
    else {
        Write-CheckResult -Name 'worker health' -Status 'FAIL' -Reason 'repository health command failed or returned no healthy worker_health event.'
    }
}

$configuredApiOrigin = if ($PSBoundParameters.ContainsKey('ApiOrigin')) { $ApiOrigin } else { $env:NOVA_E2E_API_URL }
$configuredS3Origin = if ($PSBoundParameters.ContainsKey('S3Origin')) { $S3Origin } else { $env:NOVA_E2E_S3_URL }
if (-not $PSBoundParameters.ContainsKey('ComposeProjectName')) {
    $ComposeProjectName = $env:NOVA_LOCAL_COMPOSE_PROJECT
}

$apiOriginValue = Get-LocalOrigin -SignalName 'API origin' -RawValue $configuredApiOrigin
$s3OriginValue = Get-LocalOrigin -SignalName 'S3 origin' -RawValue $configuredS3Origin

if ($null -ne $apiOriginValue) {
    Test-ApiHealth -Origin $apiOriginValue -Path '/health/live' -SignalName 'API liveness' -RequiredDatabaseState ''
    Test-ApiHealth -Origin $apiOriginValue -Path '/health/ready' -SignalName 'API readiness' -RequiredDatabaseState 'ok'
}

if ($null -ne $s3OriginValue) {
    Test-ObjectStorageHealth -Origin $s3OriginValue
}

Test-RedisHealth
Test-WorkerHealth

if ($script:blocked) {
    Write-Output 'BLOCKED: one or more local signal checks could not be executed safely.'
    exit 2
}

if ($script:failed) {
    Write-Output 'FAIL: one or more executed local signal checks did not satisfy its contract.'
    exit 1
}

Write-Output 'PASS: all required configured local signals are healthy.'
exit 0
