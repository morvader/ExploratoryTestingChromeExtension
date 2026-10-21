# Builds the Chrome Web Store package.
# Uses an allowlist of runtime files so dev tooling (.claude, .github, tests,
# configs, reports...) never ends up in the published extension.
# If you add a new runtime file or folder, add it here.
$ErrorActionPreference = "Stop"

# target path
$path = $PSScriptRoot
# construct archive path
$DateTime = (Get-Date -Format "yyyyMMddHHmmss")
$destination = Join-Path $path "ETExtension-$DateTime.zip"

# files and folders that make up the extension at runtime
$include = @(
    "manifest.json",
    "background.js",
    "popup.html",
    "css",
    "HTMLReport",
    "icons",
    "images",
    "js",
    "lib",
    "src"
)

# fail early if anything in the allowlist is missing
$files = foreach ($item in $include) {
    $fullPath = Join-Path $path $item
    if (-not (Test-Path $fullPath)) {
        throw "Missing runtime file or folder: $item"
    }
    $fullPath
}

# compress
Compress-Archive -Path $files -DestinationPath $destination -CompressionLevel Optimal
Write-Host "Created $destination"
