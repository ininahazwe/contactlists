-- Table des intitulés de poste canoniques
CREATE TABLE IF NOT EXISTS job_titles (
  id                INT AUTO_INCREMENT PRIMARY KEY,
  canonical_title   VARCHAR(255) NOT NULL UNIQUE,
  category          VARCHAR(100) NOT NULL,
  seniority_level   VARCHAR(50),
  description       TEXT,
  created_by        INT NOT NULL,
  created_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_by        INT,
  updated_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id),
  FOREIGN KEY (updated_by) REFERENCES users(id),
  INDEX idx_category (category),
  INDEX idx_seniority (seniority_level)
) ENGINE=InnoDB;

-- Table des variantes (anciens titres mappés vers les canoniques)
CREATE TABLE IF NOT EXISTS job_title_variants (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  job_title_id    INT NOT NULL,
  variant_title   VARCHAR(255) NOT NULL,
  created_by      INT NOT NULL,
  created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (job_title_id) REFERENCES job_titles(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id),
  INDEX idx_variant (variant_title),
  UNIQUE KEY unique_variant_per_title (job_title_id, variant_title)
) ENGINE=InnoDB;

-- ============================================================
-- DONNÉES : Postes canoniques
-- ============================================================

INSERT INTO job_titles (canonical_title, category, seniority_level, description, created_by)
VALUES
  ('Executive Director', 'Leadership', 'Executive', 'Chief executive officer of the organization', 1),
  ('Finance Director', 'Finance', 'Senior', 'Heads the finance department', 1),
  ('Finance Officer', 'Finance', 'Mid', 'Senior finance professional', 1),
  ('Finance Associate', 'Finance', 'Staff', 'Junior finance professional', 1),
  ('Communications Officer', 'Communications', 'Mid', 'Manages organizational communications', 1),
  ('Communication Assistant', 'Communications', 'Staff', 'Supports communications team', 1),
  ('Programme Assistant', 'Programmes', 'Staff', 'Supports programme implementation', 1),
  ('Editor', 'Media & Editorial', 'Mid', 'Edits and oversees editorial content', 1),
  ('Journalist', 'Media & Editorial', 'Mid', 'Researches and writes news content', 1),
  ('Admin Officer', 'Administration', 'Staff', 'Provides administrative support', 1),
  ('Relations Officer', 'External Relations', 'Staff', 'Manages external partnerships and relations', 1),
  ('Designer', 'Creative Services', 'Staff', 'Creates visual and graphic content', 1),
  ('Consultant', 'Support Services', 'Mid', 'Provides specialized professional services', 1),
  ('Intern', 'Internships', 'Intern', 'Intern in assigned department', 1);

-- ============================================================
-- DONNÉES : Variantes (ce qu'on a trouvé dans les données)
-- ============================================================

INSERT INTO job_title_variants (job_title_id, variant_title, created_by)
SELECT id, variant, 1 FROM job_titles
CROSS JOIN (
  SELECT 'Admin Officer' AS title, 'Admin Assistant' AS variant
  UNION ALL SELECT 'Admin Officer', 'Administrative Secretary'
  UNION ALL SELECT 'Finance Director', 'Finance Director'
  UNION ALL SELECT 'Finance Officer', 'Finance Associate'
  UNION ALL SELECT 'Communications Officer', 'Communication Assistant'
  UNION ALL SELECT 'Editor', 'Associate Editor, The Fourth Estate'
  UNION ALL SELECT 'Editor', 'Part-time Editor'
  UNION ALL SELECT 'Journalist', 'Investigative Journalist, The Fourth Estate'
  UNION ALL SELECT 'Journalist', 'Investigative Photojournalist & Digital Lead, The Fourth Estate'
  UNION ALL SELECT 'Programme Assistant', 'Programme Assistant - Communications & Outreach'
  UNION ALL SELECT 'Programme Assistant', 'Programme Assistant - Freedom of Expression and Dignity'
  UNION ALL SELECT 'Programme Assistant', 'Programme Assistant- Freedom of Expression and Dignity'
  UNION ALL SELECT 'Programme Assistant', 'Programme Assistant, AFEX'
  UNION ALL SELECT 'Relations Officer', 'External Relations Officer'
  UNION ALL SELECT 'Relations Officer', 'Desk Officer, MFWA/IFEX/IMS Liberia project'
  UNION ALL SELECT 'Relations Officer', 'AFEX Network Coordinator'
  UNION ALL SELECT 'Designer', 'Graphic Designer'
  UNION ALL SELECT 'Consultant', 'Managing Consultant'
  UNION ALL SELECT 'Consultant', 'Contract Staff (Enhancing Professional Media Stand...)'
  UNION ALL SELECT 'Intern', 'Intern, Communications & Outreach'
  UNION ALL SELECT 'Intern', 'Intern, Media for Democracy and Good Governance'
) variants
WHERE job_titles.canonical_title = variants.title;
