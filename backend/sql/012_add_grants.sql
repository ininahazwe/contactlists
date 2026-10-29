-- Module Grants: bailleurs (donors) et les projets/subventions financés par
-- chacun (budget, période, cycle de reporting, statut). Réservé aux admins
-- (données financières), même périmètre que Staff (requireRole("admin")
-- seul sur tout le routeur /api/grants).

-- Référentiel des bailleurs. Un bailleur peut financer plusieurs projets
-- (ex: Ford Foundation a 3 "Grant"), d'où une table séparée plutôt qu'un
-- simple champ texte répété sur chaque ligne de subvention.
CREATE TABLE IF NOT EXISTS donors (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(255) NOT NULL UNIQUE,
  notes       TEXT,
  created_by  INT NOT NULL,
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id)
) ENGINE=InnoDB;

-- Un "donor_grants" = un projet/subvention financé par un bailleur.
-- Nommée `donor_grants` plutôt que `grants` : GRANT est un mot réservé SQL
-- (droits d'accès), mieux vaut ne pas s'en approcher même entre backticks.
--
-- Les dates de la feuille source sont extrêmement hétérogènes (année seule,
-- "April 2026", "01-May-25", "May 1, 2026", parfois une date invalide comme
-- "April 31, 2027"...) : mêmes principes que `key_documents` -- les colonnes
-- *_label gardent le texte d'origine tel quel, *_date/*_year ne portent que
-- ce qui a pu être réellement interprété, jamais une valeur inventée.
-- Idem pour le budget : budget_label garde le texte brut ("125,000" sans
-- devise, par ex.), budget_amount/budget_currency ne sont renseignés que
-- quand ils se déduisent sans ambiguïté du texte.
CREATE TABLE IF NOT EXISTS donor_grants (
  id                INT AUTO_INCREMENT PRIMARY KEY,
  donor_id          INT NOT NULL,
  grant_label       VARCHAR(150),
  project_name      VARCHAR(255),
  key_objectives    TEXT,
  implemented_by    VARCHAR(150),
  budget_amount     DECIMAL(14,2),
  budget_currency   VARCHAR(10),
  budget_label      VARCHAR(100),
  start_label       VARCHAR(100),
  start_date        DATE,
  start_year        SMALLINT,
  end_label         VARCHAR(100),
  end_date          DATE,
  end_year          SMALLINT,
  reporting_cycle   VARCHAR(150),
  status            ENUM('ongoing', 'ended', 'unknown') NOT NULL DEFAULT 'unknown',
  comment           TEXT,
  -- Repère technique posé par l'import initial (ex. 'import-001'), pour que
  -- celui-ci reste rejouable sans dupliquer des lignes par ailleurs
  -- identiques (plusieurs bailleurs du fichier source n'ont, en l'état,
  -- strictement aucune autre donnée qui les distingue : IFEX x5, DRL x3...).
  -- Sans intérêt pour l'utilisation courante du module.
  source_ref        VARCHAR(100),
  sort_order        INT NOT NULL DEFAULT 0,
  created_by        INT NOT NULL,
  created_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (donor_id) REFERENCES donors(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id),
  INDEX idx_donor_grants_donor (donor_id),
  INDEX idx_donor_grants_status (status)
) ENGINE=InnoDB;
