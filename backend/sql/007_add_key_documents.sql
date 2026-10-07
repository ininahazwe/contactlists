-- Module Key Docs : registre des documents institutionnels + adhésions.
-- Idempotent (CREATE TABLE IF NOT EXISTS). Compatible MySQL et MariaDB.

CREATE TABLE IF NOT EXISTS key_document_categories (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(150) NOT NULL UNIQUE,
  sort_order  INT NOT NULL DEFAULT 0,
  -- 1 = les documents de cette catégorie sont à relire périodiquement (politiques,
  -- organigramme). 0 = documents datés ou à renouveler (états audités, certificats).
  reviewable  TINYINT(1) NOT NULL DEFAULT 1
) ENGINE=InnoDB;

-- Un document institutionnel = un lien (Google Drive) + un cycle de vie.
-- À ne pas confondre avec la table `documents` (fichiers S3 rattachés à un
-- contact / une organisation / un événement).
-- Les colonnes *_label conservent le texte d'origine quand il n'est pas une
-- date exploitable (ex. '1997/2016', '2025-2029', 'No longer in use').
CREATE TABLE IF NOT EXISTS key_documents (
  id               INT AUTO_INCREMENT PRIMARY KEY,
  category_id      INT NOT NULL,
  title            VARCHAR(255) NOT NULL,
  status           ENUM('available', 'outdated', 'in_review', 'missing') NOT NULL DEFAULT 'missing',
  year_label       VARCHAR(50),
  produced_label   VARCHAR(100),
  produced_year    SMALLINT,
  reviewed_on      DATE,
  reviewed_year    SMALLINT,
  review_label     VARCHAR(150),
  next_review_due  DATE,
  drive_url        VARCHAR(500),
  comment          TEXT,
  owner_staff_id   INT,
  sort_order       INT NOT NULL DEFAULT 0,
  created_by       INT NOT NULL,
  created_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES key_document_categories(id),
  FOREIGN KEY (owner_staff_id) REFERENCES staff(id) ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES users(id),
  UNIQUE KEY uq_key_documents_title (category_id, title),
  INDEX idx_key_documents_status (status),
  INDEX idx_key_documents_review (next_review_due)
) ENGINE=InnoDB;

-- Commentaires du fichier qui sont en réalité des choses à faire.
CREATE TABLE IF NOT EXISTS key_document_actions (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  document_id  INT NOT NULL,
  text         VARCHAR(500) NOT NULL,
  done         TINYINT(1) NOT NULL DEFAULT 0,
  due_date     DATE,
  created_by   INT NOT NULL,
  created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (document_id) REFERENCES key_documents(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id),
  INDEX idx_key_document_actions_open (done, document_id)
) ENGINE=InnoDB;

-- Adhésions à des réseaux / plateformes, avec leur cycle de renouvellement.
CREATE TABLE IF NOT EXISTS memberships (
  id                  INT AUTO_INCREMENT PRIMARY KEY,
  institution         VARCHAR(255) NOT NULL UNIQUE,
  year_commenced      SMALLINT,
  last_renewed_year   SMALLINT,
  renewed_label       VARCHAR(100),
  status              ENUM('active', 'renewal_due', 'lapsed', 'not_applicable', 'unknown') NOT NULL DEFAULT 'unknown',
  reporting_cycle     VARCHAR(100),
  renewal_cycle       VARCHAR(150),
  fee_amount          DECIMAL(10,2),
  fee_currency        VARCHAR(10) NOT NULL DEFAULT 'USD',
  fee_period          ENUM('annual', 'multi_year', 'one_time'),
  renewal_due_on      DATE,
  last_report_on      DATE,
  organization_id     INT,
  notes               TEXT,
  created_by          INT NOT NULL,
  created_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES users(id),
  INDEX idx_memberships_status (status)
) ENGINE=InnoDB;

INSERT INTO key_document_categories (name, sort_order, reviewable) SELECT 'Registration documents', 1, 0 WHERE NOT EXISTS (SELECT 1 FROM key_document_categories WHERE name = 'Registration documents');
INSERT INTO key_document_categories (name, sort_order, reviewable) SELECT 'Letterhead', 2, 0 WHERE NOT EXISTS (SELECT 1 FROM key_document_categories WHERE name = 'Letterhead');
INSERT INTO key_document_categories (name, sort_order, reviewable) SELECT 'Organogram', 3, 1 WHERE NOT EXISTS (SELECT 1 FROM key_document_categories WHERE name = 'Organogram');
INSERT INTO key_document_categories (name, sort_order, reviewable) SELECT 'Audited financial statements', 4, 0 WHERE NOT EXISTS (SELECT 1 FROM key_document_categories WHERE name = 'Audited financial statements');
INSERT INTO key_document_categories (name, sort_order, reviewable) SELECT 'Institutional policies', 5, 1 WHERE NOT EXISTS (SELECT 1 FROM key_document_categories WHERE name = 'Institutional policies');
