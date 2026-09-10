-- Contact Platform - schema
-- Répertoire des contacts recueillis par l'organisation au fil des événements
-- et formations. MySQL 8+

CREATE TABLE IF NOT EXISTS users (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  google_sub    VARCHAR(255) NOT NULL UNIQUE,
  email         VARCHAR(255) NOT NULL UNIQUE,
  name          VARCHAR(255) NOT NULL,
  role          ENUM('admin', 'editor', 'read_only') NOT NULL DEFAULT 'read_only',
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS organizations (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  name          VARCHAR(255) NOT NULL,
  type          VARCHAR(100),
  country       VARCHAR(100),
  notes         TEXT,
  created_by    INT NOT NULL,
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id),
  INDEX idx_organizations_name (name)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS contacts (
  id                INT AUTO_INCREMENT PRIMARY KEY,
  first_name        VARCHAR(150) NOT NULL,
  last_name         VARCHAR(150) NOT NULL,
  email             VARCHAR(255),
  phone             VARCHAR(50),
  gender            ENUM('male', 'female', 'other'),
  country           VARCHAR(100),      -- pays du contact (utile pour les listes d'acteurs par pays)
  category          ENUM(
                      'personal', 'diplomatic_corps', 'media', 'civil_society',
                      'state_institution', 'academia', 'political_party',
                      'stakeholder', 'company', 'other'
                    ) NOT NULL DEFAULT 'other',
  facebook          VARCHAR(255),
  twitter           VARCHAR(255),
  organization_id   INT,              -- organisation principale/actuelle du contact
  role_title        VARCHAR(150),
  status            ENUM('active', 'archived') NOT NULL DEFAULT 'active',
  notes             TEXT,
  created_by        INT NOT NULL,
  created_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES users(id),
  INDEX idx_contacts_name (last_name, first_name),
  INDEX idx_contacts_org (organization_id),
  INDEX idx_contacts_category (category)
) ENGINE=InnoDB;

-- Un événement ou une formation, daté, auquel participent des contacts et
-- qui implique une ou plusieurs organisations.
CREATE TABLE IF NOT EXISTS events (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  title         VARCHAR(255) NOT NULL,
  event_type    ENUM('event', 'training', 'other') NOT NULL DEFAULT 'event',
  start_date    DATE NOT NULL,
  end_date      DATE,
  location      VARCHAR(255),
  description   TEXT,
  created_by    INT NOT NULL,
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id),
  INDEX idx_events_title (title),
  INDEX idx_events_start_date (start_date)
) ENGINE=InnoDB;

-- Organisations impliquées dans un événement (many-to-many).
CREATE TABLE IF NOT EXISTS event_organizations (
  event_id        INT NOT NULL,
  organization_id INT NOT NULL,
  PRIMARY KEY (event_id, organization_id),
  FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Participation d'un contact à un événement. Le perdiem est propre à
-- chaque participation (peut varier d'un événement à l'autre pour la
-- même personne), donc porté ici plutôt que sur contacts.
CREATE TABLE IF NOT EXISTS event_contacts (
  event_id      INT NOT NULL,
  contact_id    INT NOT NULL,
  role          VARCHAR(150),           -- ex: participant, facilitateur, intervenant
  per_diem      DECIMAL(10, 2),
  currency      VARCHAR(10) DEFAULT 'USD',
  notes         TEXT,
  created_by    INT NOT NULL,
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (event_id, contact_id),
  FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
  FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id),
  INDEX idx_event_contacts_contact (contact_id)
) ENGINE=InnoDB;

-- Documents liés à un contact, une organisation ou un événement (fichier
-- réel en stockage S3-compatible, seules les métadonnées sont en base).
CREATE TABLE IF NOT EXISTS documents (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  event_id        INT,
  contact_id      INT,
  organization_id INT,
  file_name       VARCHAR(255) NOT NULL,
  storage_key     VARCHAR(500) NOT NULL,
  mime_type       VARCHAR(150),
  size_bytes      BIGINT,
  uploaded_by     INT NOT NULL,
  created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
  FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE,
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
  FOREIGN KEY (uploaded_by) REFERENCES users(id),
  CONSTRAINT chk_document_owner CHECK (
    event_id IS NOT NULL OR contact_id IS NOT NULL OR organization_id IS NOT NULL
  )
) ENGINE=InnoDB;

-- Historique des créations/modifications/suppressions. Uniquement en
-- écriture (INSERT) depuis le code applicatif.
CREATE TABLE IF NOT EXISTS audit_log (
  id            BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id       INT,
  action        ENUM('create', 'update', 'delete', 'login') NOT NULL,
  entity_type   VARCHAR(100) NOT NULL,
  entity_id     VARCHAR(100),
  before_data   JSON,
  after_data    JSON,
  ip_address    VARCHAR(64),
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_audit_entity (entity_type, entity_id),
  INDEX idx_audit_user (user_id),
  INDEX idx_audit_created (created_at)
) ENGINE=InnoDB;
