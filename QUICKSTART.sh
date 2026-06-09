#!/usr/bin/env bash

# 🚀 QUICKSTART - Gestion Administrative du Personnel
# 
# Ce script aide à exécuter rapidement la migration
# Exécution: bash QUICKSTART.sh ou ./QUICKSTART.sh

set -e

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║   🎯 INSTALLATION - Gestion Administrative du Personnel       ║"
echo "║   HR Attendance Manager - Nouvelle Fonctionnalité            ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# Vérifier les prérequis
echo "📋 Vérification des prérequis..."

if ! command -v psql &> /dev/null; then
    echo "❌ ERREUR: PostgreSQL client (psql) n'est pas installé"
    echo "   Installation: apt-get install postgresql-client (Linux)"
    echo "                 brew install postgresql (macOS)"
    exit 1
fi

if ! command -v git &> /dev/null; then
    echo "⚠️  AVERTISSEMENT: Git n'est pas installé"
fi

echo "✅ PostgreSQL client trouvé"
echo ""

# Demander les paramètres BD
echo "📦 Configuration Base de Données"
echo "================================"
read -p "Host PostgreSQL (défaut: localhost): " DB_HOST
DB_HOST=${DB_HOST:-localhost}

read -p "Port PostgreSQL (défaut: 5432): " DB_PORT
DB_PORT=${DB_PORT:-5432}

read -p "Utilisateur PostgreSQL (défaut: postgres): " DB_USER
DB_USER=${DB_USER:-postgres}

read -sp "Mot de passe PostgreSQL: " DB_PASSWORD
echo ""

read -p "Nom base de données (défaut: hr_attendance_db): " DB_NAME
DB_NAME=${DB_NAME:-hr_attendance_db}

echo ""

# Tester la connexion
echo "🔌 Test de connexion..."
if PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "SELECT version();" > /dev/null 2>&1; then
    echo "✅ Connexion réussie"
else
    echo "❌ ERREUR: Impossible de se connecter à la base de données"
    echo "   Vérifiez host, port, utilisateur et mot de passe"
    exit 1
fi

echo ""

# Exécuter le script SQL
echo "🗄️  Exécution du script de migration..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

SCRIPT_PATH="scripts/1_personnel_management_schema.sql"

if [ ! -f "$SCRIPT_PATH" ]; then
    echo "❌ ERREUR: Script SQL non trouvé"
    echo "   Chemin attendu: $SCRIPT_PATH"
    echo "   Assurez-vous d'exécuter ce script depuis la racine du projet"
    exit 1
fi

echo "Fichier: $SCRIPT_PATH"
echo "Taille: $(wc -l < "$SCRIPT_PATH") lignes"
echo ""

# Créer backup (optionnel mais recommandé)
read -p "📾 Créer un backup avant la migration? (o/n, défaut: o): " BACKUP
BACKUP=${BACKUP:-o}

if [ "$BACKUP" = "o" ] || [ "$BACKUP" = "O" ]; then
    BACKUP_DIR="backups"
    mkdir -p "$BACKUP_DIR"
    BACKUP_FILE="$BACKUP_DIR/backup_${DB_NAME}_$(date +%Y%m%d_%H%M%S).sql"
    
    echo "💾 Création du backup: $BACKUP_FILE"
    PGPASSWORD="$DB_PASSWORD" pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" "$DB_NAME" > "$BACKUP_FILE"
    echo "✅ Backup créé avec succès"
    echo ""
fi

# Exécuter la migration
echo "⏳ Exécution du script (cela peut prendre quelques secondes)..."
echo ""

PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$SCRIPT_PATH"

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Migration exécutée avec succès!"
else
    echo ""
    echo "❌ ERREUR lors de l'exécution du script"
    exit 1
fi

echo ""
echo "🔍 Vérification des tables créées..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" << EOF
\echo '📊 Tables créées:'
SELECT tablename FROM pg_tables WHERE schemaname = 'public' 
AND tablename LIKE 'contract%' OR tablename LIKE 'personnel%' 
OR tablename LIKE 'job_description%' OR tablename LIKE 'company_regulation%'
OR tablename LIKE 'regulation_%'
ORDER BY tablename;

\echo ''
\echo '🔄 Vues créées:'
SELECT viewname FROM pg_views WHERE schemaname = 'public' 
AND viewname LIKE '%view%'
ORDER BY viewname;

\echo ''
\echo '📈 Colonnes ajoutées à employees:'
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'employees' 
AND column_name IN ('gender', 'birth_date', 'marital_status', 'children_count', 'id_number', 'job_grade', 'job_echelon', 'employee_number', 'bank_account_number', 'bank_account_holder')
ORDER BY column_name;

\echo ''
\echo '⚙️  Triggers créés:'
SELECT trigger_name FROM information_schema.triggers 
WHERE trigger_schema = 'public'
ORDER BY trigger_name;

\echo ''
\echo '✅ Installation terminée avec succès!'
EOF

echo ""
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║                  ✅ MIGRATION RÉUSSIE                         ║"
echo "╠════════════════════════════════════════════════════════════════╣"
echo "║                                                                ║"
echo "║  📚 Prochaines étapes:                                        ║"
echo "║                                                                ║"
echo "║  1. Lire la documentation:                                    ║"
echo "║     📖 NEW_FEATURE_PERSONNEL_MANAGEMENT_README.md             ║"
echo "║     📖 IMPLEMENTATION_GUIDE_PERSONNEL_MANAGEMENT.md           ║"
echo "║                                                                ║"
echo "║  2. Implémenter les routes backend Express                    ║"
echo "║     Suivre: IMPLEMENTATION_GUIDE_PERSONNEL_MANAGEMENT.md      ║"
echo "║                                                                ║"
echo "║  3. Créer les pages React frontend                            ║"
echo "║     Utiliser types: src/app/data/personnelManagementTypes.ts  ║"
echo "║                                                                ║"
echo "║  4. Tester le workflow complet                                ║"
echo "║     - Upload contrat                                          ║"
echo "║     - Gestion documents                                       ║"
echo "║     - Reconnaissance règlement                                ║"
echo "║                                                                ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# Option pour ouvrir la documentation
read -p "Ouvrir la documentation maintenant? (o/n, défaut: o): " OPEN_DOCS
OPEN_DOCS=${OPEN_DOCS:-o}

if [ "$OPEN_DOCS" = "o" ] || [ "$OPEN_DOCS" = "O" ]; then
    if command -v code &> /dev/null; then
        echo "📖 Ouverture dans VS Code..."
        code NEW_FEATURE_PERSONNEL_MANAGEMENT_README.md
    elif [ "$(uname)" = "Darwin" ]; then
        open NEW_FEATURE_PERSONNEL_MANAGEMENT_README.md
    else
        echo "📄 Ouvrez manuellement: NEW_FEATURE_PERSONNEL_MANAGEMENT_README.md"
    fi
fi

echo ""
echo "✨ Prêt pour l'implémentation!"
echo ""
