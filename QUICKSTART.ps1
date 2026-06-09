# 🚀 QUICKSTART - Gestion Administrative du Personnel (Windows)
#
# Ce script PowerShell aide à exécuter rapidement la migration
# Exécution: powershell -ExecutionPolicy Bypass -File QUICKSTART.ps1

# Affichage du titre
Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║   🎯 INSTALLATION - Gestion Administrative du Personnel       ║" -ForegroundColor Cyan
Write-Host "║   HR Attendance Manager - Nouvelle Fonctionnalité            ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Vérifier les prérequis
Write-Host "📋 Vérification des prérequis..." -ForegroundColor Yellow

$psqlFound = Get-Command psql -ErrorAction SilentlyContinue
if (-not $psqlFound) {
    Write-Host "❌ ERREUR: PostgreSQL client (psql) n'est pas installé" -ForegroundColor Red
    Write-Host "   Téléchargez PostgreSQL depuis: https://www.postgresql.org/download/" -ForegroundColor Red
    Write-Host "   Ou ajoutez psql au PATH du système" -ForegroundColor Red
    exit 1
}

Write-Host "✅ PostgreSQL client trouvé" -ForegroundColor Green
Write-Host ""

# Configuration BD
Write-Host "📦 Configuration Base de Données" -ForegroundColor Yellow
Write-Host "================================"

$DB_HOST = Read-Host "Host PostgreSQL (défaut: localhost)"
if ([string]::IsNullOrEmpty($DB_HOST)) { $DB_HOST = "localhost" }

$DB_PORT = Read-Host "Port PostgreSQL (défaut: 5432)"
if ([string]::IsNullOrEmpty($DB_PORT)) { $DB_PORT = "5432" }

$DB_USER = Read-Host "Utilisateur PostgreSQL (défaut: postgres)"
if ([string]::IsNullOrEmpty($DB_USER)) { $DB_USER = "postgres" }

# Lecture du mot de passe
$DB_PASSWORD = Read-Host "Mot de passe PostgreSQL" -AsSecureString
$DB_PASSWORD_PLAIN = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto([System.Runtime.InteropServices.Marshal]::SecureStringToCoTaskMemUnicode($DB_PASSWORD))

$DB_NAME = Read-Host "Nom base de données (défaut: hr_attendance_db)"
if ([string]::IsNullOrEmpty($DB_NAME)) { $DB_NAME = "hr_attendance_db" }

Write-Host ""

# Test de connexion
Write-Host "🔌 Test de connexion..." -ForegroundColor Yellow

$env:PGPASSWORD = $DB_PASSWORD_PLAIN

try {
    $output = & psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "SELECT version();" 2>&1
    Write-Host "✅ Connexion réussie" -ForegroundColor Green
} catch {
    Write-Host "❌ ERREUR: Impossible de se connecter à la base de données" -ForegroundColor Red
    Write-Host "   Vérifiez host, port, utilisateur et mot de passe" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Vérifier le fichier SQL
Write-Host "🗄️  Exécution du script de migration..." -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

$SCRIPT_PATH = "scripts\1_personnel_management_schema.sql"

if (-not (Test-Path $SCRIPT_PATH)) {
    Write-Host "❌ ERREUR: Script SQL non trouvé" -ForegroundColor Red
    Write-Host "   Chemin attendu: $SCRIPT_PATH" -ForegroundColor Red
    Write-Host "   Assurez-vous d'exécuter ce script depuis la racine du projet" -ForegroundColor Red
    exit 1
}

$lineCount = @(Get-Content $SCRIPT_PATH).Count
Write-Host "Fichier: $SCRIPT_PATH"
Write-Host "Taille: $lineCount lignes"
Write-Host ""

# Backup
$BACKUP = Read-Host "📾 Créer un backup avant la migration? (O/n, défaut: O)"
if ([string]::IsNullOrEmpty($BACKUP) -or $BACKUP -eq "O" -or $BACKUP -eq "o") {
    $BACKUP_DIR = "backups"
    if (-not (Test-Path $BACKUP_DIR)) {
        New-Item -ItemType Directory -Path $BACKUP_DIR | Out-Null
    }
    
    $timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
    $BACKUP_FILE = "$BACKUP_DIR\backup_${DB_NAME}_${timestamp}.sql"
    
    Write-Host "💾 Création du backup: $BACKUP_FILE" -ForegroundColor Yellow
    & pg_dump -h $DB_HOST -p $DB_PORT -U $DB_USER $DB_NAME | Out-File -Encoding UTF8 $BACKUP_FILE
    Write-Host "✅ Backup créé avec succès" -ForegroundColor Green
    Write-Host ""
}

# Exécution
Write-Host "⏳ Exécution du script (cela peut prendre quelques secondes)..." -ForegroundColor Yellow
Write-Host ""

$sqlContent = Get-Content $SCRIPT_PATH -Raw
& psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f $SCRIPT_PATH

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Migration exécutée avec succès!" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "❌ ERREUR lors de l'exécution du script" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "🔍 Vérification des tables créées..." -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
Write-Host ""

$verifySQL = @"
SELECT 'Tables créées:' as "Status";
SELECT tablename FROM pg_tables WHERE schemaname = 'public' 
AND (tablename LIKE 'contract%' OR tablename LIKE 'personnel%' 
OR tablename LIKE 'job_description%' OR tablename LIKE 'company_regulation%'
OR tablename LIKE 'regulation_%')
ORDER BY tablename;
"@

& psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c $verifySQL

Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║                  ✅ MIGRATION RÉUSSIE                         ║" -ForegroundColor Green
Write-Host "╠════════════════════════════════════════════════════════════════╣" -ForegroundColor Green
Write-Host "║                                                                ║" -ForegroundColor Green
Write-Host "║  📚 Prochaines étapes:                                        ║" -ForegroundColor Green
Write-Host "║                                                                ║" -ForegroundColor Green
Write-Host "║  1. Lire la documentation:                                    ║" -ForegroundColor Green
Write-Host "║     📖 NEW_FEATURE_PERSONNEL_MANAGEMENT_README.md             ║" -ForegroundColor Green
Write-Host "║     📖 IMPLEMENTATION_GUIDE_PERSONNEL_MANAGEMENT.md           ║" -ForegroundColor Green
Write-Host "║                                                                ║" -ForegroundColor Green
Write-Host "║  2. Implémenter les routes backend Express                    ║" -ForegroundColor Green
Write-Host "║     Suivre: IMPLEMENTATION_GUIDE_PERSONNEL_MANAGEMENT.md      ║" -ForegroundColor Green
Write-Host "║                                                                ║" -ForegroundColor Green
Write-Host "║  3. Créer les pages React frontend                            ║" -ForegroundColor Green
Write-Host "║     Utiliser types: src/app/data/personnelManagementTypes.ts  ║" -ForegroundColor Green
Write-Host "║                                                                ║" -ForegroundColor Green
Write-Host "║  4. Tester le workflow complet                                ║" -ForegroundColor Green
Write-Host "║     - Upload contrat                                          ║" -ForegroundColor Green
Write-Host "║     - Gestion documents                                       ║" -ForegroundColor Green
Write-Host "║     - Reconnaissance règlement                                ║" -ForegroundColor Green
Write-Host "║                                                                ║" -ForegroundColor Green
Write-Host "╚════════════════════════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""

# Option pour ouvrir la documentation
$OPEN_DOCS = Read-Host "Ouvrir la documentation dans VS Code? (O/n, défaut: O)"
if ([string]::IsNullOrEmpty($OPEN_DOCS) -or $OPEN_DOCS -eq "O" -or $OPEN_DOCS -eq "o") {
    $codeFound = Get-Command code -ErrorAction SilentlyContinue
    if ($codeFound) {
        Write-Host "📖 Ouverture dans VS Code..." -ForegroundColor Yellow
        & code NEW_FEATURE_PERSONNEL_MANAGEMENT_README.md
    } else {
        Write-Host "📄 Ouvrez manuellement: NEW_FEATURE_PERSONNEL_MANAGEMENT_README.md" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "✨ Prêt pour l'implémentation!" -ForegroundColor Green
Write-Host ""

# Cleanup
Remove-Item Env:\PGPASSWORD -ErrorAction SilentlyContinue
