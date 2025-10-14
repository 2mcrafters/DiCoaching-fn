# PowerShell script to fix encoding issues in Fiche.jsx
# Run this with: .\fix-fiche-encoding.ps1

$filePath = "src\pages\Fiche.jsx"
$encoding = [System.Text.Encoding]::UTF8

# Read the file
$content = Get-Content -Path $filePath -Raw -Encoding UTF8

# Replace all encoding issues
$fixes = @{
    "DÃÆÃÂ©finition" = "Définition"
    "DÃÆÃÂ©couvrez" = "Découvrez"
    "DÃÆÃÂ©solÃÆÃÂ©" = "Désolé"
    "trouvÃÆÃÂ©" = "trouvé"
    "Retour ÃÆÃÂ  l'accueil" = "Retour à l'accueil"
    "ÃÆÃÂªtre connectÃÆÃÂ©" = "être connecté"
    "aimÃÆÃÂ©" = "aimé"
    "retirÃÆÃÂ©" = "retiré"
    "ÃÂ¢ÃÂÃÂ¤ÃÂ¯ÃÂ¸ÃÂ" = "❤️"
    "RÃÆÃÂ©essayez" = "Réessayez"
    "CrÃÆÃÂ©ÃÆÃÂ©" = "Créé"
}

# Apply fixes
foreach ($key in $fixes.Keys) {
    $content = $content -replace [regex]::Escape($key), $fixes[$key]
}

# Save the file with UTF-8 encoding (no BOM)
$utf8NoBom = New-Object System.Text.UTF8Encoding $false
[System.IO.File]::WriteAllText((Resolve-Path $filePath), $content, $utf8NoBom)

Write-Host "✅ Fixed encoding in $filePath" -ForegroundColor Green
