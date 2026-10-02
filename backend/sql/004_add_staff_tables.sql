-- Module Staff : répertoire RH interne (distinct de `contacts`, le répertoire externe).
-- Source : MFWA Institutional Development Documents.xlsx (onglets "MFWA Staff Details" et
-- "Staff engages 2026"), importé via POST /api/staff/import (modules/staff/import.ts).

CREATE TABLE IF NOT EXISTS staff (
  id                          INT AUTO_INCREMENT PRIMARY KEY,
  full_name                   VARCHAR(255) NOT NULL,
  job_title                   VARCHAR(255),          -- intitulé actuel ("current_role" est un mot réservé MySQL/MariaDB (CURRENT_ROLE()), d'où ce nom
  department                  VARCHAR(100),          -- MDGG, FOE&DR, Finance, Admin, The Fourth Estate... non déductible de façon fiable depuis la feuille source, à curer manuellement
  employment_type             ENUM('full_time', 'part_time', 'contract', 'intern') NOT NULL,
  nationality                 VARCHAR(100),
  year_joined                 YEAR,
  recruited_as                VARCHAR(255),          -- intitulé au recrutement, avant toute promotion
  status                      ENUM('active', 'former') NOT NULL DEFAULT 'active',
  exit_date                   DATE,
  cv_updated                  BOOLEAN,
  employee_info_sheet         BOOLEAN,
  total_years_served_raw      VARCHAR(100),          -- texte libre dans la source ("15", "10+ dont 1 an de congé sans solde") -- volontairement pas un entier
  training_opportunities_raw  VARCHAR(255),          -- texte libre, pas fiablement numérique
  travel_opportunities_raw    VARCHAR(255),          -- texte libre, pas fiablement numérique (ex: une liste de pays pour une ancienne employée)
  created_by                  INT NOT NULL,
  created_at                  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at                  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id),
  INDEX idx_staff_name (full_name),
  INDEX idx_staff_status (status),
  INDEX idx_staff_employment_type (employment_type),
  INDEX idx_staff_nationality (nationality),
  INDEX idx_staff_department (department)
) ENGINE=InnoDB;

-- Une ligne par étape de carrière, extraite du texte libre de la colonne
-- "Promotions / Role Reassignment" de la feuille source.
CREATE TABLE IF NOT EXISTS staff_role_history (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  staff_id    INT NOT NULL,
  year_from   YEAR,                  -- NULL quand aucune année exploitable n'a été trouvée dans le texte source (ex. "20..")
  year_to     YEAR,                  -- quelques entrées sont des PLAGES d'années ("2024-2026 - Project Manager..."), pas une année unique
  role_title  VARCHAR(255) NOT NULL,
  note        VARCHAR(255),          -- marqueur du type UNPARSEABLE_YEAR_TOKEN:20.. pour revue manuelle après import
  sort_order  SMALLINT NOT NULL DEFAULT 0,  -- préserve l'ordre d'origine quand les années sont absentes ou répétées
  created_by  INT NOT NULL,
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (staff_id) REFERENCES staff(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id),
  INDEX idx_role_history_staff_year (staff_id, year_from)
) ENGINE=InnoDB;

-- Fusionne les voyages/réunions/formations/conférences ; alimentée uniquement depuis
-- "Staff engages 2026" (voir le commentaire en tête de modules/staff/import.ts).
CREATE TABLE IF NOT EXISTS staff_engagements (
  id                  INT AUTO_INCREMENT PRIMARY KEY,
  staff_id            INT NOT NULL,
  engagement_type     ENUM('training', 'meeting', 'conference', 'travel') NOT NULL,
  country             VARCHAR(100),
  place               VARCHAR(255),      -- ville/lieu/"Online" -- peut différer du pays
  start_date          DATE,
  end_date            DATE,
  date_text           VARCHAR(100),      -- repli texte brut quand la date source n'est pas une vraie DATE (ex. "March 3-4", année seulement implicite via source_year)
  purpose             TEXT,
  role_in_engagement  VARCHAR(100),      -- panelist, facilitator, participant...
  source_sheet        VARCHAR(100),      -- feuille d'origine, pour audit
  source_year         YEAR,              -- année implicite de la feuille source, nécessaire pour résoudre les dates mois-seul
  created_by          INT NOT NULL,
  created_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (staff_id) REFERENCES staff(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id),
  INDEX idx_engagements_type_country_date (engagement_type, country, start_date)
) ENGINE=InnoDB;

-- Table séparée, jamais jointe par défaut dans les requêtes sur `staff` (voir
-- modules/staff/service.ts : getStaffById ne la touche jamais, seule getStaffSensitive le fait,
-- derrière une route et un rôle distincts dans modules/staff/routes.ts).
CREATE TABLE IF NOT EXISTS staff_sensitive (
  staff_id                 INT PRIMARY KEY,
  emergency_contact_name   VARCHAR(255),
  emergency_contact_phone  VARCHAR(50),
  welfare_notes            TEXT,   -- récit de bien-être (deuils, naissances, mariage) pour le personnel ACTIF
  exit_terms_notes         TEXT,   -- statut du solde de départ pour les ANCIENS ("package paid on exit", "Not a contributor") -- la feuille source réutilise la même colonne avec un sens différent selon la section, d'où la séparation ici
  exit_interview_url       VARCHAR(500),
  updated_by               INT NOT NULL,
  updated_at               DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (staff_id) REFERENCES staff(id) ON DELETE CASCADE,
  FOREIGN KEY (updated_by) REFERENCES users(id)
) ENGINE=InnoDB;

-- Note : dans le fichier Excel source, la colonne "Emergency Contact" existe mais n'est
-- jamais renseignée (0/67 lignes) -- ces champs resteront NULL après import initial.
