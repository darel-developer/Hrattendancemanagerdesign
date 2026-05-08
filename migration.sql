-- ============================================================
-- Migration HR Attendance Manager — Nouvelles fonctionnalités
-- Exécution SAFE : CREATE TABLE IF NOT EXISTS uniquement
-- Aucune donnée existante n'est modifiée ou supprimée
-- ============================================================
USE hr_attendance_db;

-- ─── Évaluations de performance ─────────────────────────────
CREATE TABLE IF NOT EXISTS performance_reviews (
  id           VARCHAR(20) PRIMARY KEY,
  employee_id  VARCHAR(10) NOT NULL,
  reviewer_id  VARCHAR(10) NOT NULL,
  period       VARCHAR(20) NOT NULL,
  rating       TINYINT     NOT NULL DEFAULT 3,
  strengths    TEXT,
  improvements TEXT,
  goals        TEXT,
  status       ENUM('Brouillon','Soumis','Acquitté') DEFAULT 'Brouillon',
  created_at   DATETIME    DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_pr_employee FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
  CONSTRAINT fk_pr_reviewer FOREIGN KEY (reviewer_id) REFERENCES employees(id) ON DELETE CASCADE
) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ─── Documents RH ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS employee_documents (
  id           VARCHAR(20)  PRIMARY KEY,
  employee_id  VARCHAR(10)  NOT NULL,
  title        VARCHAR(255) NOT NULL,
  type         VARCHAR(100) NOT NULL DEFAULT 'Autre',
  file_url     TEXT,
  expiry_date  DATE NULL,
  created_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_doc_employee FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ─── Planning des équipes ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS team_shifts (
  id           VARCHAR(20) PRIMARY KEY,
  employee_id  VARCHAR(10) NOT NULL,
  date         DATE        NOT NULL,
  start_time   TIME        NOT NULL DEFAULT '09:00:00',
  end_time     TIME        NOT NULL DEFAULT '18:00:00',
  shift_type   ENUM('Matin','Après-midi','Nuit','Repos') DEFAULT 'Matin',
  note         TEXT,
  created_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_shift_emp_date (employee_id, date),
  CONSTRAINT fk_shift_employee FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ─── Table reports (si pas encore créée par le serveur) ──────
CREATE TABLE IF NOT EXISTS reports (
  id           VARCHAR(20)  PRIMARY KEY,
  sender_id    VARCHAR(10)  NOT NULL,
  recipient_id VARCHAR(10)  NULL,
  title        VARCHAR(255) NOT NULL,
  type         VARCHAR(100) NOT NULL DEFAULT 'Rapport',
  content      TEXT         NOT NULL,
  created_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  is_read      BOOLEAN      DEFAULT FALSE,
  CONSTRAINT fk_rpt_sender    FOREIGN KEY (sender_id)    REFERENCES employees(id) ON DELETE CASCADE,
  CONSTRAINT fk_rpt_recipient FOREIGN KEY (recipient_id) REFERENCES employees(id) ON DELETE SET NULL
) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

SELECT 'Migration terminée avec succès' AS status;
