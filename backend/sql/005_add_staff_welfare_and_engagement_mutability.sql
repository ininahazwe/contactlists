-- Rend staff_engagements éditable (jusqu'ici alimentée une seule fois par l'import) et ajoute
-- staff_welfare : jusqu'ici une seule colonne texte libre (staff_sensitive.welfare_notes,
-- récit de bénéfices de bien-être pour le personnel actif, voir 004_add_staff_tables.sql) ;
-- l'utilisateur a demandé une table séparée pour les événements à venir (nom, date, montant
-- versé), plutôt qu'un seul champ texte -- `welfare_notes` est conservé tel quel (historique
-- importé, texte libre non décomposable de façon fiable), cette table est pour les entrées
-- structurées ajoutées après coup, une ligne par événement.

ALTER TABLE staff_engagements
  ADD COLUMN updated_by INT NULL AFTER created_by,
  ADD COLUMN updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER created_at,
  ADD FOREIGN KEY (updated_by) REFERENCES users(id);

-- Table séparée (même principe que staff_sensitive : jamais jointe par défaut, derrière sa
-- propre route et un rôle admin -- un montant versé est une donnée financière/personnelle).
CREATE TABLE IF NOT EXISTS staff_welfare (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  staff_id    INT NOT NULL,
  event_name  VARCHAR(255) NOT NULL,  -- ex: "Father's funeral", "Naming ceremony", "Wedding gift"
  event_date  DATE,
  amount      DECIMAL(10, 2),         -- même type que participations.per_diem (001_init.sql)
  currency    VARCHAR(10) DEFAULT 'GHC',
  notes       VARCHAR(500),
  created_by  INT NOT NULL,
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_by  INT,
  updated_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (staff_id) REFERENCES staff(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id),
  FOREIGN KEY (updated_by) REFERENCES users(id),
  INDEX idx_welfare_staff_date (staff_id, event_date)
) ENGINE=InnoDB;
