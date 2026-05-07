-- ============================================================
-- HR Attendance Manager — Schéma MySQL (multi-entreprise)
-- REIMPORTATION REQUISE : mysql -u root -p < database.sql
-- ============================================================

CREATE DATABASE IF NOT EXISTS hr_attendance_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE hr_attendance_db;

-- ─── Suppression dans l'ordre inverse des FK ─────────────────
DROP TABLE IF EXISTS notifications;
DROP TABLE IF EXISTS leave_requests;
DROP TABLE IF EXISTS attendance_records;
DROP TABLE IF EXISTS employees;
DROP TABLE IF EXISTS companies;

-- ─── Table : entreprises ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS companies (
  id             VARCHAR(10)  PRIMARY KEY,
  name           VARCHAR(100) NOT NULL,
  sector         VARCHAR(100),
  address        VARCHAR(255),
  hr_email       VARCHAR(150),
  work_start     TIME         DEFAULT '09:00:00',
  late_tolerance INT          DEFAULT 5,
  created_at     TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ─── Table : employés ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS employees (
  id             VARCHAR(10)  PRIMARY KEY,
  company_id     VARCHAR(10)  NOT NULL,
  first_name     VARCHAR(100) NOT NULL,
  last_name      VARCHAR(100) NOT NULL,
  email          VARCHAR(150) UNIQUE NOT NULL,
  phone          VARCHAR(30),
  avatar         TEXT,
  role           ENUM('Admin','Manager','Employee') NOT NULL DEFAULT 'Employee',
  department     ENUM('Ingénierie','RH','Marketing','Finance','Direction','Design') NOT NULL,
  position       VARCHAR(100),
  contract_type  ENUM('CDI','CDD','Stage','Freelance') NOT NULL DEFAULT 'CDI',
  start_date     DATE,
  salary         DECIMAL(12,2),
  status         ENUM('Actif','Inactif','En congé') NOT NULL DEFAULT 'Actif',
  manager_id     VARCHAR(10) NULL,
  address        VARCHAR(255),
  birth_date     DATE,
  leave_balance  INT DEFAULT 25,
  leave_used     INT DEFAULT 0,
  password_hash  VARCHAR(255) NULL,
  pin            VARCHAR(10)  NULL DEFAULT '1234',
  created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_emp_company FOREIGN KEY (company_id)
    REFERENCES companies(id) ON DELETE CASCADE,
  CONSTRAINT fk_manager FOREIGN KEY (manager_id)
    REFERENCES employees(id) ON DELETE SET NULL
) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ─── Table : pointages ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS attendance_records (
  id            VARCHAR(25) PRIMARY KEY,
  employee_id   VARCHAR(10) NOT NULL,
  date          DATE        NOT NULL,
  check_in      TIME        NULL,
  check_out     TIME        NULL,
  status        ENUM('Présent','Absent','Retard','Congé','Télétravail') NOT NULL,
  hours_worked  DECIMAL(5,2) NULL,
  note          TEXT,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_att_emp_date (employee_id, date),
  CONSTRAINT fk_att_emp FOREIGN KEY (employee_id)
    REFERENCES employees(id) ON DELETE CASCADE
) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ─── Table : demandes de congé ───────────────────────────────
CREATE TABLE IF NOT EXISTS leave_requests (
  id            VARCHAR(20) PRIMARY KEY,
  employee_id   VARCHAR(10) NOT NULL,
  type          ENUM('Congé annuel','Maladie','Congé maternité','RTT','Exceptionnel') NOT NULL,
  start_date    DATE        NOT NULL,
  end_date      DATE        NOT NULL,
  days          INT         NOT NULL,
  reason        TEXT,
  status        ENUM('En attente','Approuvé','Refusé') NOT NULL DEFAULT 'En attente',
  request_date  DATE        NOT NULL,
  reviewed_by   VARCHAR(10) NULL,
  review_date   DATE        NULL,
  comment       TEXT,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_leave_emp FOREIGN KEY (employee_id)
    REFERENCES employees(id) ON DELETE CASCADE,
  CONSTRAINT fk_leave_reviewer FOREIGN KEY (reviewed_by)
    REFERENCES employees(id) ON DELETE SET NULL
) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ─── Table : notifications ───────────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
  id           VARCHAR(10) PRIMARY KEY,
  type         ENUM('absence','conge','document','retard','system') NOT NULL,
  title        VARCHAR(255) NOT NULL,
  message      TEXT        NOT NULL,
  date         DATETIME    NOT NULL,
  is_read      BOOLEAN     DEFAULT FALSE,
  employee_id  VARCHAR(10) NULL,
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_notif_emp FOREIGN KEY (employee_id)
    REFERENCES employees(id) ON DELETE SET NULL
) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;


-- ============================================================
-- Données initiales
-- ============================================================

-- ─── Entreprises ─────────────────────────────────────────────
INSERT INTO companies (id, name, sector, address, hr_email, work_start, late_tolerance)
VALUES
('COMP001', 'TechCorp Solutions', 'Technologie', '12 Rue de la Paix, Paris', 'rh@techcorp.com', '09:00:00', 10),
('COMP002', 'InnoGroup Afrique', 'Finance & Conseil', 'Plateau, Abidjan, Côte d\'Ivoire', 'rh@innogroup.ci', '08:00:00', 5);

-- ─── Employés (mot de passe par défaut : admin1234) ──────────
-- SHA2('admin1234', 256) = 7c222fb2927d828af22f592134e8932480637c0d459489e39c4b0766d6f34bbb
INSERT INTO employees
  (id, company_id, first_name, last_name, email, phone, avatar, role, department,
   position, contract_type, start_date, salary, status, manager_id,
   address, birth_date, leave_balance, leave_used, password_hash, pin)
VALUES
('EMP001','COMP001','Sophie','Moreau','sophie.moreau@company.com','+33 6 12 34 56 78',
 'https://images.unsplash.com/photo-1610387694365-19fafcc86d86?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=200',
 'Admin','Direction','DRH','CDI','2019-03-15',650000.00,'Actif',NULL,
 '12 Rue de la Paix, Paris','1985-07-22',25,8,
 SHA2('admin1234',256),'1111'),

('EMP002','COMP001','Thomas','Dubois','thomas.dubois@company.com','+33 6 98 76 54 32',
 'https://images.unsplash.com/photo-1629507208649-70919ca33793?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=200',
 'Manager','Ingénierie','Lead Developer','CDI','2020-06-01',580000.00,'Actif','EMP001',
 '45 Avenue Victor Hugo, Lyon','1990-02-14',25,12,
 SHA2('admin1234',256),'2222'),

('EMP003','COMP001','Amina','Benali','amina.benali@company.com','+33 6 55 44 33 22',
 'https://images.unsplash.com/photo-1666867936058-de34bfd5b320?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=200',
 'Employee','RH','Chargée RH','CDI','2021-09-01',380000.00,'Actif','EMP001',
 '8 Rue des Fleurs, Marseille','1993-11-30',25,5,
 SHA2('admin1234',256),'3333'),

('EMP004','COMP001','Lucas','Bernard','lucas.bernard@company.com','+33 7 11 22 33 44',
 'https://images.unsplash.com/photo-1753450298481-362990f811ea?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=200',
 'Employee','Ingénierie','Développeur Frontend','CDI','2022-02-14',420000.00,'Actif','EMP002',
 '33 Boulevard Montparnasse, Paris','1996-05-08',25,3,
 SHA2('admin1234',256),'4444'),

('EMP005','COMP001','Claire','Fontaine','claire.fontaine@company.com','+33 6 77 88 99 00',
 'https://images.unsplash.com/photo-1758518727888-ffa196002e59?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=200',
 'Manager','Marketing','Responsable Marketing','CDI','2020-11-03',520000.00,'En congé','EMP001',
 '19 Rue du Commerce, Bordeaux','1988-09-17',25,18,
 SHA2('admin1234',256),'5555'),

('EMP006','COMP001','Mehdi','Karim','mehdi.karim@company.com','+33 6 33 44 55 66',
 'https://images.unsplash.com/photo-1629507208649-70919ca33793?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=200',
 'Employee','Finance','Contrôleur Financier','CDI','2021-04-12',460000.00,'Actif','EMP001',
 '27 Rue Nationale, Lille','1991-01-25',25,7,
 SHA2('admin1234',256),'6666'),

('EMP007','COMP001','Léa','Martin','lea.martin@company.com','+33 6 22 11 00 99',
 'https://images.unsplash.com/photo-1610387694365-19fafcc86d86?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=200',
 'Employee','Design','UI/UX Designer','CDD','2023-01-09',350000.00,'Actif','EMP002',
 '5 Allée des Roses, Nice','1998-08-12',18,2,
 SHA2('admin1234',256),'7777'),

('EMP008','COMP001','Antoine','Leroy','antoine.leroy@company.com','+33 7 99 88 77 66',
 'https://images.unsplash.com/photo-1629507208649-70919ca33793?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=200',
 'Employee','Ingénierie','Développeur Backend','Stage','2024-02-01',180000.00,'Inactif','EMP002',
 '14 Rue de la République, Strasbourg','2000-03-29',10,0,
 SHA2('admin1234',256),'8888'),

-- Employés de la 2e entreprise
('EMP101','COMP002','Kouadio','Yao','k.yao@innogroup.ci','+225 07 12 34 56 78',
 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=200',
 'Admin','Direction','Directeur RH','CDI','2018-01-10',1200000.00,'Actif',NULL,
 'Plateau, Abidjan','1982-04-15',25,3,
 SHA2('admin1234',256),'9999'),

('EMP102','COMP002','Fatou','Diallo','f.diallo@innogroup.ci','+225 07 98 76 54 32',
 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=200',
 'Employee','Finance','Analyste Financier','CDI','2021-06-01',750000.00,'Actif','EMP101',
 'Cocody, Abidjan','1994-08-22',25,5,
 SHA2('admin1234',256),'0000');

-- ─── Pointages ───────────────────────────────────────────────
INSERT INTO attendance_records
  (id, employee_id, date, check_in, check_out, status, hours_worked, note)
VALUES
('ATT001','EMP001',CURDATE(),'08:55','18:10','Présent',9.25,''),
('ATT002','EMP002',CURDATE(),'09:15','18:30','Retard',9.25,'Retard de 15 min'),
('ATT003','EMP003',CURDATE(),'08:45','17:45','Présent',9.00,''),
('ATT004','EMP004',CURDATE(),'09:00',NULL,'Présent',NULL,''),
('ATT005','EMP005',CURDATE(),NULL,NULL,'Congé',0.00,'Congé validé'),
('ATT006','EMP006',CURDATE(),'08:30','17:30','Présent',9.00,''),
('ATT007','EMP007',CURDATE(),'09:00','18:00','Télétravail',9.00,'Télétravail approuvé'),
('ATT008','EMP008',CURDATE(),NULL,NULL,'Absent',0.00,'Non justifié'),
('ATT009','EMP001',DATE_SUB(CURDATE(),INTERVAL 1 DAY),'09:00','18:00','Présent',9.00,''),
('ATT010','EMP002',DATE_SUB(CURDATE(),INTERVAL 1 DAY),'09:00','18:30','Présent',9.50,''),
('ATT011','EMP003',DATE_SUB(CURDATE(),INTERVAL 1 DAY),'09:30','18:00','Retard',8.50,''),
('ATT012','EMP004',DATE_SUB(CURDATE(),INTERVAL 1 DAY),'09:00','18:00','Présent',9.00,''),
('ATT013','EMP006',DATE_SUB(CURDATE(),INTERVAL 1 DAY),'08:30','17:30','Présent',9.00,''),
('ATT014','EMP007',DATE_SUB(CURDATE(),INTERVAL 1 DAY),'09:00','18:00','Télétravail',9.00,'');

-- ─── Demandes de congé ────────────────────────────────────────
INSERT INTO leave_requests
  (id, employee_id, type, start_date, end_date, days, reason, status,
   request_date, reviewed_by, review_date, comment)
VALUES
('LVE001','EMP004','Congé annuel',
 DATE_ADD(CURDATE(),INTERVAL 6 DAY), DATE_ADD(CURDATE(),INTERVAL 11 DAY), 5,
 'Vacances en famille','En attente',DATE_SUB(CURDATE(),INTERVAL 4 DAY),NULL,NULL,''),

('LVE002','EMP003','RTT',
 DATE_ADD(CURDATE(),INTERVAL 2 DAY), DATE_ADD(CURDATE(),INTERVAL 2 DAY), 1,
 'RTT accumulée','Approuvé',DATE_SUB(CURDATE(),INTERVAL 6 DAY),'EMP001',DATE_SUB(CURDATE(),INTERVAL 5 DAY),'Approuvé'),

('LVE003','EMP005','Congé annuel',
 DATE_SUB(CURDATE(),INTERVAL 7 DAY), DATE_ADD(CURDATE(),INTERVAL 4 DAY), 10,
 'Congé printemps','Approuvé',DATE_SUB(CURDATE(),INTERVAL 30 DAY),'EMP001',DATE_SUB(CURDATE(),INTERVAL 28 DAY),''),

('LVE004','EMP006','Maladie',
 DATE_SUB(CURDATE(),INTERVAL 12 DAY), DATE_SUB(CURDATE(),INTERVAL 11 DAY), 2,
 'Arrêt médical','Approuvé',DATE_SUB(CURDATE(),INTERVAL 12 DAY),'EMP001',DATE_SUB(CURDATE(),INTERVAL 12 DAY),'Justificatif reçu'),

('LVE005','EMP007','Exceptionnel',
 DATE_ADD(CURDATE(),INTERVAL 21 DAY), DATE_ADD(CURDATE(),INTERVAL 21 DAY), 1,
 'Déménagement','En attente',DATE_SUB(CURDATE(),INTERVAL 2 DAY),NULL,NULL,''),

('LVE006','EMP002','Congé annuel',
 DATE_ADD(CURDATE(),INTERVAL 28 DAY), DATE_ADD(CURDATE(),INTERVAL 32 DAY), 5,
 'Vacances','Refusé',DATE_SUB(CURDATE(),INTERVAL 36 DAY),'EMP001',DATE_SUB(CURDATE(),INTERVAL 34 DAY),'Pic de charge projet');

-- ─── Notifications ────────────────────────────────────────────
INSERT INTO notifications
  (id, type, title, message, date, is_read, employee_id)
VALUES
('N001','absence','Absence non justifiée',
 'Antoine Leroy est absent aujourd\'hui sans justificatif.',
 NOW(), FALSE, 'EMP008'),

('N002','retard','Retard signalé',
 'Thomas Dubois a pointé avec 15 min de retard.',
 NOW(), FALSE, 'EMP002'),

('N003','conge','Demande de congé en attente',
 'Lucas Bernard a soumis une demande de congé pour la semaine prochaine.',
 DATE_SUB(NOW(),INTERVAL 4 DAY), FALSE, 'EMP004'),

('N004','conge','Demande de congé en attente',
 'Léa Martin a soumis une demande de congé exceptionnel.',
 DATE_SUB(NOW(),INTERVAL 2 DAY), FALSE, 'EMP007'),

('N005','document','Contrat expirant',
 'Le CDD de Léa Martin expire dans 60 jours.',
 DATE_SUB(NOW(),INTERVAL 1 DAY), TRUE, 'EMP007'),

('N006','system','Export rapport mensuel',
 'Le rapport de présence du mois dernier est prêt à être exporté.',
 DATE_SUB(NOW(),INTERVAL 3 DAY), TRUE, NULL),

('N007','document','Stage expirant',
 'Le stage d\'Antoine Leroy expire dans 45 jours.',
 DATE_SUB(NOW(),INTERVAL 1 DAY), TRUE, 'EMP008'),

('N008','absence','Taux d\'absence élevé',
 'Le département Ingénierie a un taux d\'absence élevé cette semaine.',
 NOW(), FALSE, NULL);
