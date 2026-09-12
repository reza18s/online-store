# Starts the local PostgreSQL/Redis/S3 dependencies and the Bun API.
# These defaults are for local development only; do not use them in production.

[CmdletBinding()]
param (
    [ValidateRange(1, 65535)]
    [int]$PostgresPort = 55432,

    [ValidateRange(1, 65535)]
    [int]$RedisPort = 56379,

    [ValidateRange(1, 65535)]
    [int]$S3Port = 59000,

    [ValidateRange(1, 65535)]
    [int]$S3ConsolePort = 59001,

    [ValidateRange(1, 65535)]
    [int]$ApiPort = 4000,

    [uri]$WebOrigin = 'http://127.0.0.1:5173',

    [string]$ComposeProject = 'nova-local'
)

$ErrorActionPreference = 'Stop'
$repositoryRoot = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot '..\..')).Path
$previousEnvironment = @{
    POSTGRES_PORT = $env:POSTGRES_PORT
    REDIS_PORT = $env:REDIS_PORT
    S3_PORT = $env:S3_PORT
    S3_CONSOLE_PORT = $env:S3_CONSOLE_PORT
    DATABASE_URL = $env:DATABASE_URL
    REDIS_URL = $env:REDIS_URL
    API_PORT = $env:API_PORT
    WEB_ORIGIN = $env:WEB_ORIGIN
}

function Restore-EnvironmentVariable {
    param (
        [Parameter(Mandatory)]
        [string]$Name,

        [AllowNull()]
        [string]$Value
    )

    if ($null -eq $Value) {
        Remove-Item -LiteralPath "Env:$Name" -ErrorAction SilentlyContinue
        return
    }

    Set-Item -LiteralPath "Env:$Name" -Value $Value
}

function Test-LocalTcpPort {
    param (
        [Parameter(Mandatory)]
        [int]$Port
    )

    $client = [System.Net.Sockets.TcpClient]::new()
    try {
        $connection = $client.BeginConnect('127.0.0.1', $Port, $null, $null)
        if (-not $connection.AsyncWaitHandle.WaitOne(1000)) {
            return $false
        }

        $client.EndConnect($connection)
        return $true
    }
    catch {
        return $false
    }
    finally {
        $client.Dispose()
    }
}

function Wait-ForLocalTcpPort {
    param (
        [Parameter(Mandatory)]
        [int]$Port,

        [Parameter(Mandatory)]
        [string]$ServiceName
    )

    for ($attempt = 1; $attempt -le 30; $attempt++) {
        if (Test-LocalTcpPort -Port $Port) {
            return
        }

        Start-Sleep -Seconds 2
    }

    throw "$ServiceName is healthy inside Docker, but host port $Port is not reachable through 127.0.0.1."
}

function Test-HealthyLocalApi {
    param (
        [Parameter(Mandatory)]
        [int]$Port
    )

    if (-not (Test-LocalTcpPort -Port $Port)) {
        return $false
    }

    try {
        $response = Invoke-WebRequest -UseBasicParsing -Uri "http://127.0.0.1:$Port/health/ready" -TimeoutSec 5
        if ($response.StatusCode -ne 200) {
            return $false
        }

        $payload = $response.Content | ConvertFrom-Json
        return (
            $payload.status -eq 'ok' -and
            $payload.service -eq 'api' -and
            $payload.database -eq 'ok'
        )
    }
    catch {
        return $false
    }
}

Push-Location -LiteralPath $repositoryRoot
try {
    $env:POSTGRES_PORT = [string]$PostgresPort
    $env:REDIS_PORT = [string]$RedisPort
    $env:S3_PORT = [string]$S3Port
    $env:S3_CONSOLE_PORT = [string]$S3ConsolePort
    $env:API_PORT = [string]$ApiPort
    $env:DATABASE_URL = "postgresql://nova:nova_local_only@127.0.0.1:$PostgresPort/nova?schema=public"
    $env:REDIS_URL = "redis://127.0.0.1:$RedisPort"
    $env:WEB_ORIGIN = $WebOrigin.AbsoluteUri.TrimEnd('/')

    $composeArgs = @(
        '--project-name', $ComposeProject,
        '--env-file', '.env.example',
        '-f', 'infra/docker/compose.yml'
    )

    Write-Host "Starting PostgreSQL, Redis, and S3 for Compose project '$ComposeProject'..."
    docker compose @composeArgs up -d postgres redis s3
    if ($LASTEXITCODE -ne 0) {
        throw 'Docker Compose failed to start PostgreSQL, Redis, and S3.'
    }

    $postgresReady = $false
    for ($attempt = 1; $attempt -le 30; $attempt++) {
        docker compose @composeArgs exec -T postgres pg_isready -U nova -d nova *> $null
        if ($LASTEXITCODE -eq 0) {
            $postgresReady = $true
            break
        }

        Start-Sleep -Seconds 2
    }

    if (-not $postgresReady) {
        throw 'PostgreSQL did not become ready within 60 seconds.'
    }
    Wait-ForLocalTcpPort -Port $PostgresPort -ServiceName 'PostgreSQL'

    $redisReady = $false
    for ($attempt = 1; $attempt -le 30; $attempt++) {
        docker compose @composeArgs exec -T redis redis-cli ping *> $null
        if ($LASTEXITCODE -eq 0) {
            $redisReady = $true
            break
        }

        Start-Sleep -Seconds 2
    }

    if (-not $redisReady) {
        throw 'Redis did not become ready within 60 seconds.'
    }
    Wait-ForLocalTcpPort -Port $RedisPort -ServiceName 'Redis'

    $s3Ready = $false
    for ($attempt = 1; $attempt -le 30; $attempt++) {
        docker compose @composeArgs exec -T s3 mc ready local *> $null
        if ($LASTEXITCODE -eq 0) {
            $s3Ready = $true
            break
        }

        Start-Sleep -Seconds 2
    }

    if (-not $s3Ready) {
        throw 'S3 did not become ready within 60 seconds.'
    }
    Wait-ForLocalTcpPort -Port $S3Port -ServiceName 'S3'

    docker compose @composeArgs exec -T s3 sh -c 'mc alias set admin http://127.0.0.1:9000 "$MINIO_ROOT_USER" "$MINIO_ROOT_PASSWORD" >/dev/null && mc mb --ignore-existing "admin/$S3_BUCKET" >/dev/null'
    if ($LASTEXITCODE -ne 0) {
        throw 'S3 bucket initialization failed.'
    }

    $s3ApiConfig = docker compose @composeArgs exec -T s3 sh -c 'mc admin config get admin api' | Out-String
    if ($LASTEXITCODE -ne 0 -or $s3ApiConfig -notmatch 'stale_uploads_expiry=' -or $s3ApiConfig -notmatch 'stale_uploads_cleanup_interval=') {
        throw 'S3 stale multipart-upload cleanup configuration could not be verified.'
    }

    bun run db:generate
    if ($LASTEXITCODE -ne 0) {
        throw 'Prisma client generation failed.'
    }

    bun run db:migrate
    if ($LASTEXITCODE -ne 0) {
        throw 'Prisma migrations failed.'
    }

    bun run db:seed
    if ($LASTEXITCODE -ne 0) {
        throw 'Database seed failed.'
    }

    if (Test-HealthyLocalApi -Port $ApiPort) {
        Write-Host "Local dependencies and API are already ready on http://127.0.0.1:$ApiPort. Reusing the existing API process."
        return
    }

    if (Test-LocalTcpPort -Port $ApiPort) {
        throw "API port $ApiPort is already in use by a process that did not pass the local readiness check. Stop that owner or choose -ApiPort."
    }

    Write-Host "Local dependencies are ready. Starting the API on http://127.0.0.1:$ApiPort with web origin $env:WEB_ORIGIN..."
    bun run dev:api
    if ($LASTEXITCODE -ne 0) {
        throw 'The API process exited with a failure code.'
    }
}
finally {
    Pop-Location
    Restore-EnvironmentVariable -Name 'POSTGRES_PORT' -Value $previousEnvironment.POSTGRES_PORT
    Restore-EnvironmentVariable -Name 'REDIS_PORT' -Value $previousEnvironment.REDIS_PORT
    Restore-EnvironmentVariable -Name 'S3_PORT' -Value $previousEnvironment.S3_PORT
    Restore-EnvironmentVariable -Name 'S3_CONSOLE_PORT' -Value $previousEnvironment.S3_CONSOLE_PORT
    Restore-EnvironmentVariable -Name 'DATABASE_URL' -Value $previousEnvironment.DATABASE_URL
    Restore-EnvironmentVariable -Name 'REDIS_URL' -Value $previousEnvironment.REDIS_URL
    Restore-EnvironmentVariable -Name 'API_PORT' -Value $previousEnvironment.API_PORT
    Restore-EnvironmentVariable -Name 'WEB_ORIGIN' -Value $previousEnvironment.WEB_ORIGIN
}
