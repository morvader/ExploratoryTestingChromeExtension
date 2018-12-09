# target path
$path = "."
# construct archive path
$DateTime = (Get-Date -Format "yyyyMMddHHmmss")
$destination = Join-Path $path ".\ETExtension-$DateTime.zip"
# exclusion rules. Can use wild cards (*)
$exclude = @("_*.config","ARCHIVE","*.zip","test","screenshots", ".gitignore",".\.git","*.ps1")
# get files to compress using exclusion filer
$files = Get-ChildItem -Path $path -Exclude $exclude
# compress
Compress-Archive -Path $files -DestinationPath $destination -CompressionLevel Optimal