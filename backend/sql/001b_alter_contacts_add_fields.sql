-- Ta table `contacts` a été créée avant l'ajout des champs genre/pays/
-- catégorie/réseaux sociaux. Ce script les ajoute sans toucher aux données
-- déjà en place (organisations et événements déjà importés restent intacts).
-- À exécuter UNE FOIS, avant de reprendre l'import à 002c_import_contacts_part1.sql.

ALTER TABLE contacts
  ADD COLUMN IF NOT EXISTS gender ENUM('male', 'female', 'other') AFTER phone,
  ADD COLUMN IF NOT EXISTS country VARCHAR(100) AFTER gender,
  ADD COLUMN IF NOT EXISTS category ENUM(
    'personal', 'diplomatic_corps', 'media', 'civil_society',
    'state_institution', 'academia', 'political_party',
    'stakeholder', 'company', 'other'
  ) NOT NULL DEFAULT 'other' AFTER country,
  ADD COLUMN IF NOT EXISTS facebook VARCHAR(255) AFTER category,
  ADD COLUMN IF NOT EXISTS twitter VARCHAR(255) AFTER facebook;

ALTER TABLE contacts
  ADD INDEX IF NOT EXISTS idx_contacts_category (category);
