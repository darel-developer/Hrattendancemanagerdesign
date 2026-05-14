'use strict';
/**
 * Génère deploy_pg.sql — migration MariaDB → PostgreSQL avec encodage corrigé.
 * Usage : node server/scripts/export_to_pg.js
 */
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Corrige les caractères mojibake issus d'un import avec mauvais encodage
function fix(v) {
  if (typeof v !== 'string') return v;
  return v
    .replace(/├®/g, 'é').replace(/├░/g, 'è').replace(/├á/g, 'à')
    .replace(/├¢/g, 'â').replace(/├¬/g, 'ê').replace(/├«/g, 'î')
    .replace(/├┤/g, 'ô').replace(/├╗/g, 'û').replace(/├╣/g, 'ù')
    .replace(/├ñ/g, 'ç').replace(/Γ£│/g, 'É').replace(/Γ£¡/g, 'È')
    .replace(/Γ£ú/g, 'Â').replace(/├ä/g, 'ä').replace(/├ñ/g, 'ñ');
}

function sqlVal(v) {
  if (v === null || v === undefined) return 'NULL';
  if (typeof v === 'boolean') return v ? 'TRUE' : 'FALSE';
  if (typeof v === 'number') return String(v);
  const s = fix(String(v));
  return `'${s.replace(/'/g, "''")}'`;
}

async function main() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'hr_attendance_db',
    charset: 'utf8mb4',
    dateStrings: true,
  });

  const lines = [];
  lines.push('-- PostgreSQL migration — HR Attendance Manager');
  lines.push(`-- Généré le ${new Date().toISOString()}`);
  lines.push('');
  lines.push('SET client_encoding = \'UTF8\';');
  lines.push('');

  // ── Schéma ────────────────────────────────────────────────────────────────
  lines.push(`
CREATE TABLE IF NOT EXISTS companies (
  id              VARCHAR(10)    PRIMARY KEY,
  name            VARCHAR(100)   NOT NULL,
  sector          VARCHAR(100)   DEFAULT NULL,
  address         VARCHAR(255)   DEFAULT NULL,
  hr_email        VARCHAR(150)   DEFAULT NULL,
  work_start      TIME           DEFAULT '09:00:00',
  late_tolerance  INTEGER        DEFAULT 5,
  created_at      TIMESTAMP      DEFAULT CURRENT_TIMESTAMP,
  latitude        NUMERIC(10,7)  DEFAULT NULL,
  longitude       NUMERIC(10,7)  DEFAULT NULL,
  geo_radius      INTEGER        NOT NULL DEFAULT 100
);

CREATE TABLE IF NOT EXISTS employees (
  id             VARCHAR(10)   PRIMARY KEY,
  company_id     VARCHAR(10)   NOT NULL,
  first_name     VARCHAR(100)  NOT NULL,
  last_name      VARCHAR(100)  NOT NULL,
  email          VARCHAR(150)  NOT NULL UNIQUE,
  phone          VARCHAR(30)   DEFAULT NULL,
  avatar         TEXT          DEFAULT NULL,
  role           VARCHAR(20)   NOT NULL DEFAULT 'Employee',
  department     VARCHAR(100)  NOT NULL DEFAULT '',
  position       VARCHAR(100)  DEFAULT NULL,
  contract_type  VARCHAR(20)   NOT NULL DEFAULT 'CDI',
  start_date     DATE          DEFAULT NULL,
  salary         NUMERIC(12,2) DEFAULT NULL,
  status         VARCHAR(20)   NOT NULL DEFAULT 'Actif',
  manager_id     VARCHAR(10)   DEFAULT NULL,
  address        VARCHAR(255)  DEFAULT NULL,
  birth_date     DATE          DEFAULT NULL,
  leave_balance  INTEGER       DEFAULT 25,
  leave_used     INTEGER       DEFAULT 0,
  password_hash  VARCHAR(255)  DEFAULT NULL,
  pin            VARCHAR(10)   DEFAULT '1234',
  created_at     TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  work_days      VARCHAR(255)  DEFAULT NULL,
  CONSTRAINT fk_emp_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
  CONSTRAINT fk_manager     FOREIGN KEY (manager_id) REFERENCES employees(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS attendance_records (
  id           VARCHAR(25)   PRIMARY KEY,
  employee_id  VARCHAR(10)   NOT NULL,
  date         DATE          NOT NULL,
  check_in     TIME          DEFAULT NULL,
  check_out    TIME          DEFAULT NULL,
  status       VARCHAR(20)   NOT NULL,
  hours_worked NUMERIC(5,2)  DEFAULT NULL,
  note         TEXT          DEFAULT NULL,
  created_at   TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (employee_id, date),
  CONSTRAINT fk_att_emp FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS leave_requests (
  id           VARCHAR(20)   PRIMARY KEY,
  employee_id  VARCHAR(10)   NOT NULL,
  type         VARCHAR(50)   NOT NULL,
  start_date   DATE          NOT NULL,
  end_date     DATE          NOT NULL,
  days         INTEGER       NOT NULL,
  reason       TEXT          DEFAULT NULL,
  status       VARCHAR(20)   NOT NULL DEFAULT 'En attente',
  request_date DATE          NOT NULL,
  reviewed_by  VARCHAR(10)   DEFAULT NULL,
  review_date  DATE          DEFAULT NULL,
  comment      TEXT          DEFAULT NULL,
  created_at   TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_leave_emp      FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
  CONSTRAINT fk_leave_reviewer FOREIGN KEY (reviewed_by) REFERENCES employees(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS notifications (
  id          VARCHAR(20)   PRIMARY KEY,
  type        VARCHAR(30)   NOT NULL,
  title       VARCHAR(255)  NOT NULL,
  message     TEXT          NOT NULL,
  date        TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  is_read     BOOLEAN       DEFAULT FALSE,
  employee_id VARCHAR(10)   DEFAULT NULL
);

CREATE TABLE IF NOT EXISTS performance_reviews (
  id           VARCHAR(20)   PRIMARY KEY,
  employee_id  VARCHAR(10)   NOT NULL,
  reviewer_id  VARCHAR(10)   NOT NULL,
  period       VARCHAR(50)   NOT NULL,
  rating       NUMERIC(3,1)  DEFAULT NULL,
  strengths    TEXT,
  improvements TEXT,
  goals        TEXT,
  status       VARCHAR(20)   NOT NULL DEFAULT 'Brouillon',
  created_at   TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_perf_emp      FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
  CONSTRAINT fk_perf_reviewer FOREIGN KEY (reviewer_id) REFERENCES employees(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS employee_documents (
  id          VARCHAR(20)   PRIMARY KEY,
  employee_id VARCHAR(10)   NOT NULL,
  title       VARCHAR(255)  NOT NULL,
  type        VARCHAR(100)  NOT NULL DEFAULT 'Autre',
  file_url    TEXT          DEFAULT NULL,
  expiry_date DATE          DEFAULT NULL,
  created_at  TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_doc_employee FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS planning (
  id          VARCHAR(20)   PRIMARY KEY,
  employee_id VARCHAR(10)   NOT NULL,
  date        DATE          NOT NULL,
  start_time  TIME          DEFAULT NULL,
  end_time    TIME          DEFAULT NULL,
  shift_type  VARCHAR(20)   NOT NULL DEFAULT 'Matin',
  note        TEXT          DEFAULT '',
  created_at  TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_plan_emp FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS reports (
  id              VARCHAR(20)   PRIMARY KEY,
  sender_id       VARCHAR(10)   NOT NULL,
  recipient_id    VARCHAR(10)   NULL,
  title           VARCHAR(255)  NOT NULL,
  type            VARCHAR(100)  NOT NULL DEFAULT 'Rapport',
  content         TEXT          NOT NULL,
  created_at      TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  is_read         BOOLEAN       DEFAULT FALSE,
  attachment_name VARCHAR(255)  NULL,
  attachment_data TEXT          NULL,
  CONSTRAINT fk_rpt_sender    FOREIGN KEY (sender_id)    REFERENCES employees(id) ON DELETE CASCADE,
  CONSTRAINT fk_rpt_recipient FOREIGN KEY (recipient_id) REFERENCES employees(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS departments (
  id         VARCHAR(50)   PRIMARY KEY,
  company_id VARCHAR(50)   NOT NULL,
  name       VARCHAR(100)  NOT NULL,
  created_at TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (company_id, name)
);
`);

  // ── Données ───────────────────────────────────────────────────────────────
  const tables = [
    { name: 'companies',           cols: ['id','name','sector','address','hr_email','work_start','late_tolerance','created_at','latitude','longitude','geo_radius'] },
    { name: 'employees',           cols: ['id','company_id','first_name','last_name','email','phone','avatar','role','department','position','contract_type','start_date','salary','status','manager_id','address','birth_date','leave_balance','leave_used','password_hash','pin','created_at','work_days'] },
    { name: 'attendance_records',  cols: ['id','employee_id','date','check_in','check_out','status','hours_worked','note','created_at'] },
    { name: 'leave_requests',      cols: ['id','employee_id','type','start_date','end_date','days','reason','status','request_date','reviewed_by','review_date','comment','created_at'] },
    { name: 'notifications',       cols: ['id','type','title','message','date','is_read','employee_id'] },
    { name: 'departments',         cols: ['id','company_id','name','created_at'] },
  ];

  for (const { name, cols } of tables) {
    const [rows] = await conn.query(`SELECT * FROM \`${name}\``);
    if (!rows.length) {
      lines.push(`-- ${name}: aucune donnée`);
      continue;
    }
    lines.push(`-- ${name} (${rows.length} lignes)`);
    for (const row of rows) {
      const vals = cols.map(c => sqlVal(row[c]));
      lines.push(`INSERT INTO ${name} (${cols.join(', ')}) VALUES (${vals.join(', ')}) ON CONFLICT DO NOTHING;`);
    }
    lines.push('');
  }

  await conn.end();

  const out = path.join(__dirname, '../../deploy_pg.sql');
  fs.writeFileSync(out, lines.join('\n'), 'utf8');
  console.log(`✓ deploy_pg.sql généré (${lines.length} lignes)`);
}

main().catch(err => { console.error('Erreur:', err.message); process.exit(1); });
