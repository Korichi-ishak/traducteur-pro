# Script de démarrage rapide - Traducteur Pro
# Exécutez ce fichier pour démarrer le serveur et le client en même temps

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "  🌍  TRADUCTEUR PRO - Démarrage automatique" -ForegroundColor Yellow
Write-Host "  Allemand ⇄ Français" -ForegroundColor Yellow
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

# Vérifier Node.js
$nodeVersion = node --version 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Node.js n'est pas installé !" -ForegroundColor Red
    Write-Host "   Téléchargez Node.js sur: https://nodejs.org/" -ForegroundColor Yellow
    Write-Host ""
    Read-Host "Appuyez sur Entrée pour quitter"
    exit 1
}

Write-Host "✓ Node.js détecté: $nodeVersion" -ForegroundColor Green
Write-Host ""

# Vérifier l'installation des dépendances serveur
if (!(Test-Path "server\node_modules")) {
    Write-Host "📦 Installation des dépendances serveur..." -ForegroundColor Yellow
    Set-Location server
    npm install
    Set-Location ..
    Write-Host "✓ Dépendances serveur installées" -ForegroundColor Green
    Write-Host ""
}

# Vérifier l'installation des dépendances client
if (!(Test-Path "client\node_modules")) {
    Write-Host "📦 Installation des dépendances client..." -ForegroundColor Yellow
    Set-Location client
    npm install
    Set-Location ..
    Write-Host "✓ Dépendances client installées" -ForegroundColor Green
    Write-Host ""
}

Write-Host "🚀 Démarrage de l'application..." -ForegroundColor Yellow
Write-Host ""
Write-Host "  • Serveur API : http://localhost:5000" -ForegroundColor Cyan
Write-Host "  • Application : http://localhost:3000" -ForegroundColor Cyan
Write-Host ""
Write-Host "  L'application React s'ouvrira automatiquement dans votre navigateur." -ForegroundColor White
Write-Host ""
Write-Host "  Pour arrêter les serveurs, fermez cette fenêtre ou appuyez sur Ctrl+C" -ForegroundColor White
Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

# Démarrer le serveur en arrière-plan
Start-Job -Name "Server" -ScriptBlock {
    Set-Location $using:PWD\server
    npm start
} | Out-Null

Write-Host "✓ Serveur démarré (port 5000)" -ForegroundColor Green

# Attendre 2 secondes pour que le serveur démarre
Start-Sleep -Seconds 2

# Démarrer le client React
Write-Host "✓ Démarrage du client React..." -ForegroundColor Green
Write-Host ""

Set-Location client
npm start

# Nettoyer les jobs en arrière-plan à la fin
Get-Job | Stop-Job
Get-Job | Remove-Job
