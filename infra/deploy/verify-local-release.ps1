# Verifies the repository-owned build and launch contract for a local release.
# This script does not start services, deploy, contact providers, or inspect secrets.

[CmdletBinding()]
param(
    [switch]$SkipBuild
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$repositoryRoot = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot '..\..')).Path

function Write-Event {
    param(
        [Parameter(Mandatory = $true)]
        [ValidateSet('PASS', 'FAIL')]
        [string]$Status,

        [Parameter(Mandatory = $true)]
        [string]$Message,

        [object]$Data = $null
    )

    $event = [ordered]@{
        status  = $Status
        message = $Message
    }

    if ($null -ne $Data) {
        $event.data = $Data
    }

    [Console]::Out.WriteLine(($event | ConvertTo-Json -Compress -Depth 6))
}

function Assert-Condition {
    param(
        [Parameter(Mandatory = $true)]
        [bool]$Condition,

        [Parameter(Mandatory = $true)]
        [string]$Message
    )

    if (-not $Condition) {
        throw "FAIL: $Message"
    }
}

function Read-PackageManifest {
    param(
        [Parameter(Mandatory = $true)]
        [string]$RelativePath
    )

    $path = Join-Path $repositoryRoot $RelativePath
    Assert-Condition (Test-Path -LiteralPath $path -PathType Leaf) "Package manifest '$RelativePath' is missing."

    try {
        return (Get-Content -Raw -LiteralPath $path | ConvertFrom-Json)
    }
    catch {
        throw "FAIL: Package manifest '$RelativePath' is not valid JSON."
    }
}

function Assert-NoReparsePoint {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Path,

        [Parameter(Mandatory = $true)]
        [string]$RelativePath
    )

    $currentPath = [System.IO.Path]::GetFullPath($Path)
    $rootPath = [System.IO.Path]::GetFullPath($repositoryRoot).TrimEnd([System.IO.Path]::DirectorySeparatorChar, [System.IO.Path]::AltDirectorySeparatorChar)

    while ($true) {
        if (Test-Path -LiteralPath $currentPath) {
            $item = Get-Item -Force -LiteralPath $currentPath
            Assert-Condition (($item.Attributes -band [System.IO.FileAttributes]::ReparsePoint) -eq 0) "Repository path '$RelativePath' contains a reparse point at '$currentPath'."
        }

        if ($currentPath -ieq $rootPath) {
            break
        }

        $parentPath = [System.IO.Path]::GetDirectoryName($currentPath)
        Assert-Condition (-not [string]::IsNullOrWhiteSpace($parentPath) -and $parentPath -ne $currentPath) "Repository path '$RelativePath' is not contained by the repository root."
        $currentPath = $parentPath
    }
}

function Assert-NonEmptyFile {
    param(
        [Parameter(Mandatory = $true)]
        [string]$RelativePath
    )

    $path = Join-Path $repositoryRoot $RelativePath
    Assert-Condition (Test-Path -LiteralPath $path -PathType Leaf) "Expected build artifact '$RelativePath' is missing."
    Assert-NoReparsePoint -Path $path -RelativePath $RelativePath

    $item = Get-Item -LiteralPath $path
    Assert-Condition ($item.Length -gt 0) "Expected build artifact '$RelativePath' is empty."
}

function Invoke-BunBuild {
    $generatedOutputDirectories = @(
        'packages/config/dist',
        'packages/api-client/dist',
        'packages/db/dist',
        'packages/ui/dist',
        'apps/api/dist',
        'apps/web/dist',
        'apps/worker/dist'
    )

    foreach ($relativePath in $generatedOutputDirectories) {
        $outputDirectory = Join-Path $repositoryRoot $relativePath
        if (Test-Path -LiteralPath $outputDirectory -PathType Container) {
            Assert-NoReparsePoint -Path $outputDirectory -RelativePath $relativePath
            Remove-Item -LiteralPath $outputDirectory -Recurse -Force
        }
    }

    Push-Location -LiteralPath $repositoryRoot
    try {
        & bun run db:generate
        if ($LASTEXITCODE -ne 0) {
            throw "FAIL: 'bun run db:generate' exited with code $LASTEXITCODE."
        }

        & bun run build
        if ($LASTEXITCODE -ne 0) {
            throw "FAIL: 'bun run build' exited with code $LASTEXITCODE."
        }
    }
    finally {
        Pop-Location
    }
}

Push-Location -LiteralPath $repositoryRoot
try {
    $rootManifest = Read-PackageManifest -RelativePath 'package.json'
    $requiredRootScripts = @('typecheck', 'lint', 'test', 'build', 'docker:config')
    foreach ($scriptName in $requiredRootScripts) {
        Assert-Condition ($null -ne $rootManifest.scripts.$scriptName) "Root package script '$scriptName' is missing."
    }

    $launchContracts = @(
        [pscustomobject]@{
            Name = 'api'
            Manifest = 'apps/api/package.json'
            Start = 'bun dist/main.js'
            Artifacts = @('apps/api/dist/main.js')
        },
        [pscustomobject]@{
            Name = 'web'
            Manifest = 'apps/web/package.json'
            Start = 'node dist/ssr/server.mjs'
            Artifacts = @('apps/web/dist/index.html', 'apps/web/dist/ssr/server.mjs')
        },
        [pscustomobject]@{
            Name = 'worker'
            Manifest = 'apps/worker/package.json'
            Start = 'bun dist/main.js'
            Artifacts = @('apps/worker/dist/main.js', 'apps/worker/dist/health.js')
        }
    )

    foreach ($contract in $launchContracts) {
        $manifest = Read-PackageManifest -RelativePath $contract.Manifest
        Assert-Condition ($manifest.scripts.start -eq $contract.Start) "The $($contract.Name) start script must remain '$($contract.Start)'."
    }

    # -SkipBuild is intentionally artifact-only; it must not generate or build anything.
    if (-not $SkipBuild) {
        Invoke-BunBuild
    }

    $packageArtifacts = @(
        'packages/config/dist/index.js',
        'packages/api-client/dist/index.js',
        'packages/db/dist/index.js',
        'packages/ui/dist/index.js'
    )

    foreach ($artifact in $packageArtifacts) {
        Assert-NonEmptyFile -RelativePath $artifact
    }

    foreach ($contract in $launchContracts) {
        foreach ($artifact in $contract.Artifacts) {
            Assert-NonEmptyFile -RelativePath $artifact
        }
    }

    Write-Event -Status 'PASS' -Message 'Local release build and launch contract verified.' -Data ([ordered]@{
            buildExecuted = (-not $SkipBuild)
            packages = $packageArtifacts
            launchArtifacts = @($launchContracts | ForEach-Object {
                    [ordered]@{
                        service = $_.Name
                        start = $_.Start
                        artifacts = $_.Artifacts
                    }
                })
        })
    exit 0
}
catch {
    Write-Event -Status 'FAIL' -Message $_.Exception.Message
    exit 1
}
finally {
    Pop-Location
}
