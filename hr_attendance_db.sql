-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Hôte : 127.0.0.1
-- Généré le : jeu. 07 mai 2026 à 17:08
-- Version du serveur : 10.4.32-MariaDB
-- Version de PHP : 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de données : `hr_attendance_db`
--

-- --------------------------------------------------------

--
-- Structure de la table `attendance_records`
--

CREATE TABLE `attendance_records` (
  `id` varchar(25) NOT NULL,
  `employee_id` varchar(10) NOT NULL,
  `date` date NOT NULL,
  `check_in` time DEFAULT NULL,
  `check_out` time DEFAULT NULL,
  `status` enum('Présent','Absent','Retard','Congé','Télétravail') NOT NULL,
  `hours_worked` decimal(5,2) DEFAULT NULL,
  `note` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `attendance_records`
--

INSERT INTO `attendance_records` (`id`, `employee_id`, `date`, `check_in`, `check_out`, `status`, `hours_worked`, `note`, `created_at`) VALUES
('ATT001', 'EMP001', '2026-05-07', '08:55:00', '18:10:00', 'Présent', 9.25, '', '2026-05-07 14:33:50'),
('ATT002', 'EMP002', '2026-05-07', '09:15:00', '18:30:00', 'Retard', 9.25, 'Retard de 15 min', '2026-05-07 14:33:50'),
('ATT003', 'EMP003', '2026-05-07', '08:45:00', '17:45:00', 'Présent', 9.00, '', '2026-05-07 14:33:50'),
('ATT004', 'EMP004', '2026-05-07', '09:00:00', NULL, 'Présent', NULL, '', '2026-05-07 14:33:50'),
('ATT005', 'EMP005', '2026-05-07', NULL, NULL, 'Congé', 0.00, 'Congé validé', '2026-05-07 14:33:50'),
('ATT006', 'EMP006', '2026-05-07', '08:30:00', '17:30:00', 'Présent', 9.00, '', '2026-05-07 14:33:50'),
('ATT007', 'EMP007', '2026-05-07', '09:00:00', '18:00:00', 'Télétravail', 9.00, 'Télétravail approuvé', '2026-05-07 14:33:50'),
('ATT008', 'EMP008', '2026-05-07', NULL, NULL, 'Absent', 0.00, 'Non justifié', '2026-05-07 14:33:50'),
('ATT009', 'EMP001', '2026-05-06', '09:00:00', '18:00:00', 'Présent', 9.00, '', '2026-05-07 14:33:50'),
('ATT010', 'EMP002', '2026-05-06', '09:00:00', '18:30:00', 'Présent', 9.50, '', '2026-05-07 14:33:50'),
('ATT011', 'EMP003', '2026-05-06', '09:30:00', '18:00:00', 'Retard', 8.50, '', '2026-05-07 14:33:50'),
('ATT012', 'EMP004', '2026-05-06', '09:00:00', '18:00:00', 'Présent', 9.00, '', '2026-05-07 14:33:50'),
('ATT013', 'EMP006', '2026-05-06', '08:30:00', '17:30:00', 'Présent', 9.00, '', '2026-05-07 14:33:50'),
('ATT014', 'EMP007', '2026-05-06', '09:00:00', '18:00:00', 'Télétravail', 9.00, '', '2026-05-07 14:33:50');

-- --------------------------------------------------------

--
-- Structure de la table `companies`
--

CREATE TABLE `companies` (
  `id` varchar(10) NOT NULL,
  `name` varchar(100) NOT NULL,
  `sector` varchar(100) DEFAULT NULL,
  `address` varchar(255) DEFAULT NULL,
  `hr_email` varchar(150) DEFAULT NULL,
  `work_start` time DEFAULT '09:00:00',
  `late_tolerance` int(11) DEFAULT 5,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `companies`
--

INSERT INTO `companies` (`id`, `name`, `sector`, `address`, `hr_email`, `work_start`, `late_tolerance`, `created_at`) VALUES
('COMP001', 'TechCorp Solutions', 'Technologie', '12 Rue de la Paix, Paris', 'rh@techcorp.com', '09:00:00', 10, '2026-05-07 14:33:50'),
('COMP002', 'InnoGroup Afrique', 'Finance & Conseil', 'Plateau, Abidjan, Côte d\'Ivoire', 'rh@innogroup.ci', '08:00:00', 5, '2026-05-07 14:33:50'),
('COMP459994', 'Global Move CN', 'cabinent de conseil en orientation et immigration', 'Rue de la Tunisie,  Yaoundé', 'global@gmail.com', '08:30:00', 15, '2026-05-07 14:34:40');

-- --------------------------------------------------------

--
-- Structure de la table `employees`
--

CREATE TABLE `employees` (
  `id` varchar(10) NOT NULL,
  `company_id` varchar(10) NOT NULL,
  `first_name` varchar(100) NOT NULL,
  `last_name` varchar(100) NOT NULL,
  `email` varchar(150) NOT NULL,
  `phone` varchar(30) DEFAULT NULL,
  `avatar` text DEFAULT NULL,
  `role` enum('Admin','Manager','Employee') NOT NULL DEFAULT 'Employee',
  `department` enum('Ingénierie','RH','Marketing','Finance','Direction','Design') NOT NULL,
  `position` varchar(100) DEFAULT NULL,
  `contract_type` enum('CDI','CDD','Stage','Freelance') NOT NULL DEFAULT 'CDI',
  `start_date` date DEFAULT NULL,
  `salary` decimal(12,2) DEFAULT NULL,
  `status` enum('Actif','Inactif','En congé') NOT NULL DEFAULT 'Actif',
  `manager_id` varchar(10) DEFAULT NULL,
  `address` varchar(255) DEFAULT NULL,
  `birth_date` date DEFAULT NULL,
  `leave_balance` int(11) DEFAULT 25,
  `leave_used` int(11) DEFAULT 0,
  `password_hash` varchar(255) DEFAULT NULL,
  `pin` varchar(10) DEFAULT '1234',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `employees`
--

INSERT INTO `employees` (`id`, `company_id`, `first_name`, `last_name`, `email`, `phone`, `avatar`, `role`, `department`, `position`, `contract_type`, `start_date`, `salary`, `status`, `manager_id`, `address`, `birth_date`, `leave_balance`, `leave_used`, `password_hash`, `pin`, `created_at`) VALUES
('EMP001', 'COMP001', 'Sophie', 'Moreau', 'sophie.moreau@company.com', '+33 6 12 34 56 78', 'https://images.unsplash.com/photo-1610387694365-19fafcc86d86?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=200', 'Admin', 'Direction', 'DRH', 'CDI', '2019-03-15', 650000.00, 'Actif', NULL, '12 Rue de la Paix, Paris', '1985-07-22', 25, 8, 'ac9689e2272427085e35b9d3e3e8bed88cb3434828b43b86fc0596cad4c6e270', '1111', '2026-05-07 14:33:50'),
('EMP002', 'COMP001', 'Thomas', 'Dubois', 'thomas.dubois@company.com', '+33 6 98 76 54 32', 'https://images.unsplash.com/photo-1629507208649-70919ca33793?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=200', 'Manager', 'Ingénierie', 'Lead Developer', 'CDI', '2020-06-01', 580000.00, 'Actif', 'EMP001', '45 Avenue Victor Hugo, Lyon', '1990-02-14', 25, 12, 'ac9689e2272427085e35b9d3e3e8bed88cb3434828b43b86fc0596cad4c6e270', '2222', '2026-05-07 14:33:50'),
('EMP003', 'COMP001', 'Amina', 'Benali', 'amina.benali@company.com', '+33 6 55 44 33 22', 'https://images.unsplash.com/photo-1666867936058-de34bfd5b320?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=200', 'Employee', 'RH', 'Chargée RH', 'CDI', '2021-09-01', 380000.00, 'Actif', 'EMP001', '8 Rue des Fleurs, Marseille', '1993-11-30', 25, 5, 'ac9689e2272427085e35b9d3e3e8bed88cb3434828b43b86fc0596cad4c6e270', '3333', '2026-05-07 14:33:50'),
('EMP004', 'COMP001', 'Lucas', 'Bernard', 'lucas.bernard@company.com', '+33 7 11 22 33 44', 'https://images.unsplash.com/photo-1753450298481-362990f811ea?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=200', 'Employee', 'Ingénierie', 'Développeur Frontend', 'CDI', '2022-02-14', 420000.00, 'Actif', 'EMP002', '33 Boulevard Montparnasse, Paris', '1996-05-08', 25, 3, 'ac9689e2272427085e35b9d3e3e8bed88cb3434828b43b86fc0596cad4c6e270', '4444', '2026-05-07 14:33:50'),
('EMP005', 'COMP001', 'Claire', 'Fontaine', 'claire.fontaine@company.com', '+33 6 77 88 99 00', 'https://images.unsplash.com/photo-1758518727888-ffa196002e59?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=200', 'Manager', 'Marketing', 'Responsable Marketing', 'CDI', '2020-11-03', 520000.00, 'En congé', 'EMP001', '19 Rue du Commerce, Bordeaux', '1988-09-17', 25, 18, 'ac9689e2272427085e35b9d3e3e8bed88cb3434828b43b86fc0596cad4c6e270', '5555', '2026-05-07 14:33:50'),
('EMP006', 'COMP001', 'Mehdi', 'Karim', 'mehdi.karim@company.com', '+33 6 33 44 55 66', 'https://images.unsplash.com/photo-1629507208649-70919ca33793?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=200', 'Employee', 'Finance', 'Contrôleur Financier', 'CDI', '2021-04-12', 460000.00, 'Actif', 'EMP001', '27 Rue Nationale, Lille', '1991-01-25', 25, 7, 'ac9689e2272427085e35b9d3e3e8bed88cb3434828b43b86fc0596cad4c6e270', '6666', '2026-05-07 14:33:50'),
('EMP007', 'COMP001', 'Léa', 'Martin', 'lea.martin@company.com', '+33 6 22 11 00 99', 'https://images.unsplash.com/photo-1610387694365-19fafcc86d86?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=200', 'Employee', 'Design', 'UI/UX Designer', 'CDD', '2023-01-09', 350000.00, 'Actif', 'EMP002', '5 Allée des Roses, Nice', '1998-08-12', 18, 2, 'ac9689e2272427085e35b9d3e3e8bed88cb3434828b43b86fc0596cad4c6e270', '7777', '2026-05-07 14:33:50'),
('EMP008', 'COMP001', 'Antoine', 'Leroy', 'antoine.leroy@company.com', '+33 7 99 88 77 66', 'https://images.unsplash.com/photo-1629507208649-70919ca33793?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=200', 'Employee', 'Ingénierie', 'Développeur Backend', 'Stage', '2024-02-01', 180000.00, 'Inactif', 'EMP002', '14 Rue de la République, Strasbourg', '2000-03-29', 10, 0, 'ac9689e2272427085e35b9d3e3e8bed88cb3434828b43b86fc0596cad4c6e270', '8888', '2026-05-07 14:33:50'),
('EMP101', 'COMP002', 'Kouadio', 'Yao', 'k.yao@innogroup.ci', '+225 07 12 34 56 78', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=200', 'Admin', 'Direction', 'Directeur RH', 'CDI', '2018-01-10', 1200000.00, 'Actif', NULL, 'Plateau, Abidjan', '1982-04-15', 25, 3, 'ac9689e2272427085e35b9d3e3e8bed88cb3434828b43b86fc0596cad4c6e270', '9999', '2026-05-07 14:33:50'),
('EMP102', 'COMP002', 'Fatou', 'Diallo', 'f.diallo@innogroup.ci', '+225 07 98 76 54 32', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=200', 'Employee', 'Finance', 'Analyste Financier', 'CDI', '2021-06-01', 750000.00, 'Actif', 'EMP101', 'Cocody, Abidjan', '1994-08-22', 25, 5, 'ac9689e2272427085e35b9d3e3e8bed88cb3434828b43b86fc0596cad4c6e270', '0000', '2026-05-07 14:33:50'),
('EMP497460', 'COMP459994', 'Ange', 'Trecy', 'Ange@gmail.com', '+237 6 66 80 12 50', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop', 'Admin', 'Direction', 'Administrateur', 'CDI', '2026-05-07', 120000.00, 'Actif', NULL, 'Carrefour obili', NULL, 25, 0, 'f6cfe289bbfa10e1fa917b9d1a8ef547f3373e0b8e23b16446500d7c157bb0ed', '1234', '2026-05-07 14:34:57'),
('EMPOVL9PKT', 'COMP459994', 'DAREL', 'SANANG NYA', 'sanangdarel17@gmail.com', '+237686236882', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop', 'Manager', 'Ingénierie', 'Team Informatique', 'CDI', '2026-05-07', 100000.00, 'Actif', NULL, 'Nkolfoulou', '2004-04-07', 25, 0, 'f6cfe289bbfa10e1fa917b9d1a8ef547f3373e0b8e23b16446500d7c157bb0ed', '1234', '2026-05-07 14:36:02'),
('EMPOVLTKVN', 'COMP459994', 'Karim', 'Abdel', 'karim@gmail.com', '+237693865560', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop', 'Employee', 'Ingénierie', 'Team Informatique', 'CDI', '2026-05-07', 120000.00, 'Actif', 'EMPOVL9PKT', 'Mbankomo', '2002-01-03', 25, 0, '5c5ef63c284fc9004b0b159d24e2bedefe195d3dd4c00a411cd825b0ade06944', '1234', '2026-05-07 14:51:29');

-- --------------------------------------------------------

--
-- Structure de la table `leave_requests`
--

CREATE TABLE `leave_requests` (
  `id` varchar(20) NOT NULL,
  `employee_id` varchar(10) NOT NULL,
  `type` enum('Congé annuel','Maladie','Congé maternité','RTT','Exceptionnel') NOT NULL,
  `start_date` date NOT NULL,
  `end_date` date NOT NULL,
  `days` int(11) NOT NULL,
  `reason` text DEFAULT NULL,
  `status` enum('En attente','Approuvé','Refusé') NOT NULL DEFAULT 'En attente',
  `request_date` date NOT NULL,
  `reviewed_by` varchar(10) DEFAULT NULL,
  `review_date` date DEFAULT NULL,
  `comment` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `leave_requests`
--

INSERT INTO `leave_requests` (`id`, `employee_id`, `type`, `start_date`, `end_date`, `days`, `reason`, `status`, `request_date`, `reviewed_by`, `review_date`, `comment`, `created_at`) VALUES
('LVE001', 'EMP004', 'Congé annuel', '2026-05-13', '2026-05-18', 5, 'Vacances en famille', 'En attente', '2026-05-03', NULL, NULL, '', '2026-05-07 14:33:50'),
('LVE002', 'EMP003', 'RTT', '2026-05-09', '2026-05-09', 1, 'RTT accumulée', 'Approuvé', '2026-05-01', 'EMP001', '2026-05-02', 'Approuvé', '2026-05-07 14:33:50'),
('LVE003', 'EMP005', 'Congé annuel', '2026-04-30', '2026-05-11', 10, 'Congé printemps', 'Approuvé', '2026-04-07', 'EMP001', '2026-04-09', '', '2026-05-07 14:33:50'),
('LVE004', 'EMP006', 'Maladie', '2026-04-25', '2026-04-26', 2, 'Arrêt médical', 'Approuvé', '2026-04-25', 'EMP001', '2026-04-25', 'Justificatif reçu', '2026-05-07 14:33:50'),
('LVE005', 'EMP007', 'Exceptionnel', '2026-05-28', '2026-05-28', 1, 'Déménagement', 'En attente', '2026-05-05', NULL, NULL, '', '2026-05-07 14:33:50'),
('LVE006', 'EMP002', 'Congé annuel', '2026-06-04', '2026-06-08', 5, 'Vacances', 'Refusé', '2026-04-01', 'EMP001', '2026-04-03', 'Pic de charge projet', '2026-05-07 14:33:50');

-- --------------------------------------------------------

--
-- Structure de la table `notifications`
--

CREATE TABLE `notifications` (
  `id` varchar(10) NOT NULL,
  `type` enum('absence','conge','document','retard','system') NOT NULL,
  `title` varchar(255) NOT NULL,
  `message` text NOT NULL,
  `date` datetime NOT NULL,
  `is_read` tinyint(1) DEFAULT 0,
  `employee_id` varchar(10) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `notifications`
--

INSERT INTO `notifications` (`id`, `type`, `title`, `message`, `date`, `is_read`, `employee_id`, `created_at`) VALUES
('N001', 'absence', 'Absence non justifiée', 'Antoine Leroy est absent aujourd\'hui sans justificatif.', '2026-05-07 15:33:50', 0, 'EMP008', '2026-05-07 14:33:50'),
('N002', 'retard', 'Retard signalé', 'Thomas Dubois a pointé avec 15 min de retard.', '2026-05-07 15:33:50', 0, 'EMP002', '2026-05-07 14:33:50'),
('N003', 'conge', 'Demande de congé en attente', 'Lucas Bernard a soumis une demande de congé pour la semaine prochaine.', '2026-05-03 15:33:50', 0, 'EMP004', '2026-05-07 14:33:50'),
('N004', 'conge', 'Demande de congé en attente', 'Léa Martin a soumis une demande de congé exceptionnel.', '2026-05-05 15:33:50', 0, 'EMP007', '2026-05-07 14:33:50'),
('N005', 'document', 'Contrat expirant', 'Le CDD de Léa Martin expire dans 60 jours.', '2026-05-06 15:33:50', 1, 'EMP007', '2026-05-07 14:33:50'),
('N006', 'system', 'Export rapport mensuel', 'Le rapport de présence du mois dernier est prêt à être exporté.', '2026-05-04 15:33:50', 1, NULL, '2026-05-07 14:33:50'),
('N007', 'document', 'Stage expirant', 'Le stage d\'Antoine Leroy expire dans 45 jours.', '2026-05-06 15:33:50', 1, 'EMP008', '2026-05-07 14:33:50'),
('N008', 'absence', 'Taux d\'absence élevé', 'Le département Ingénierie a un taux d\'absence élevé cette semaine.', '2026-05-07 15:33:50', 1, NULL, '2026-05-07 14:33:50'),
('NOTOVMB64Q', 'document', 'Rapport reçu : Absences', 'Ange Trecy vous a envoyé un rapport \"Absences\". Rapport des absences — mai 2026\n\nTotal absences: 2\nAbsences justifiées: 1\nAbsences non justifiées: 1\n\nImpact financier e…', '2026-05-07 16:05:10', 0, 'EMPOVL9PKT', '2026-05-07 15:05:10');

-- --------------------------------------------------------

--
-- Structure de la table `reports`
--

CREATE TABLE `reports` (
  `id` varchar(20) NOT NULL,
  `sender_id` varchar(10) NOT NULL,
  `recipient_id` varchar(10) DEFAULT NULL,
  `title` varchar(255) NOT NULL,
  `type` varchar(100) NOT NULL DEFAULT 'Rapport',
  `content` text NOT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `is_read` tinyint(1) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `reports`
--

INSERT INTO `reports` (`id`, `sender_id`, `recipient_id`, `title`, `type`, `content`, `created_at`, `is_read`) VALUES
('RPTOVMB63L', 'EMP497460', 'EMPOVL9PKT', 'Absences', 'Rapport de performance', 'Rapport des absences — mai 2026\n\nTotal absences: 2\nAbsences justifiées: 1\nAbsences non justifiées: 1\n\nImpact financier estimé:\n3 employés × taux journalier moyen\n\nMesures prises:\n[À compléter]', '2026-05-07 16:05:10', 1);

--
-- Index pour les tables déchargées
--

--
-- Index pour la table `attendance_records`
--
ALTER TABLE `attendance_records`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_att_emp_date` (`employee_id`,`date`);

--
-- Index pour la table `companies`
--
ALTER TABLE `companies`
  ADD PRIMARY KEY (`id`);

--
-- Index pour la table `employees`
--
ALTER TABLE `employees`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD KEY `fk_emp_company` (`company_id`),
  ADD KEY `fk_manager` (`manager_id`);

--
-- Index pour la table `leave_requests`
--
ALTER TABLE `leave_requests`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_leave_emp` (`employee_id`),
  ADD KEY `fk_leave_reviewer` (`reviewed_by`);

--
-- Index pour la table `notifications`
--
ALTER TABLE `notifications`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_notif_emp` (`employee_id`);

--
-- Index pour la table `reports`
--
ALTER TABLE `reports`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_rpt_sender` (`sender_id`),
  ADD KEY `fk_rpt_recipient` (`recipient_id`);

--
-- Contraintes pour les tables déchargées
--

--
-- Contraintes pour la table `attendance_records`
--
ALTER TABLE `attendance_records`
  ADD CONSTRAINT `fk_att_emp` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE CASCADE;

--
-- Contraintes pour la table `employees`
--
ALTER TABLE `employees`
  ADD CONSTRAINT `fk_emp_company` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_manager` FOREIGN KEY (`manager_id`) REFERENCES `employees` (`id`) ON DELETE SET NULL;

--
-- Contraintes pour la table `leave_requests`
--
ALTER TABLE `leave_requests`
  ADD CONSTRAINT `fk_leave_emp` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_leave_reviewer` FOREIGN KEY (`reviewed_by`) REFERENCES `employees` (`id`) ON DELETE SET NULL;

--
-- Contraintes pour la table `notifications`
--
ALTER TABLE `notifications`
  ADD CONSTRAINT `fk_notif_emp` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE SET NULL;

--
-- Contraintes pour la table `reports`
--
ALTER TABLE `reports`
  ADD CONSTRAINT `fk_rpt_recipient` FOREIGN KEY (`recipient_id`) REFERENCES `employees` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_rpt_sender` FOREIGN KEY (`sender_id`) REFERENCES `employees` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
