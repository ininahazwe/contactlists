-- Import des données historiques MFWA DATABASE.xlsx
-- Généré automatiquement - relire avant exécution, notamment les dates
-- d'événements marquées 'approximative' dans leur description.
-- Idempotent : peut être ré-exécuté sans dupliquer les organisations/contacts/événements.

SET @import_user := (SELECT id FROM users ORDER BY id LIMIT 1);
-- 12 evenements

INSERT INTO events (title, event_type, start_date, description, created_by) SELECT 'WAMECA 2018', 'event', '2018-01-01', NULL, @import_user WHERE NOT EXISTS (SELECT 1 FROM events WHERE title = 'WAMECA 2018');
INSERT INTO events (title, event_type, start_date, description, created_by) SELECT 'WAMECA 2019', 'event', '2019-01-01', NULL, @import_user WHERE NOT EXISTS (SELECT 1 FROM events WHERE title = 'WAMECA 2019');
INSERT INTO events (title, event_type, start_date, description, created_by) SELECT 'WAMECA 2020', 'event', '2020-01-01', NULL, @import_user WHERE NOT EXISTS (SELECT 1 FROM events WHERE title = 'WAMECA 2020');
INSERT INTO events (title, event_type, start_date, description, created_by) SELECT 'WAMECA 2021', 'event', '2021-01-01', NULL, @import_user WHERE NOT EXISTS (SELECT 1 FROM events WHERE title = 'WAMECA 2021');
INSERT INTO events (title, event_type, start_date, description, created_by) SELECT 'WAMECA 2022', 'event', '2022-01-01', NULL, @import_user WHERE NOT EXISTS (SELECT 1 FROM events WHERE title = 'WAMECA 2022');
INSERT INTO events (title, event_type, start_date, description, created_by) SELECT 'WAMECA 2023', 'event', '2023-01-01', NULL, @import_user WHERE NOT EXISTS (SELECT 1 FROM events WHERE title = 'WAMECA 2023');
INSERT INTO events (title, event_type, start_date, description, created_by) SELECT 'TRAINING ON ACCESS TO INFORMATION FOR CITIZEN GROUP (OBUASI)', 'training', '2020-01-01', 'Date approximative - à corriger après import.', @import_user WHERE NOT EXISTS (SELECT 1 FROM events WHERE title = 'TRAINING ON ACCESS TO INFORMATION FOR CITIZEN GROUP (OBUASI)');
INSERT INTO events (title, event_type, start_date, description, created_by) SELECT 'TRAINING ON ACCESS TO INFORMATION FOR CITIZEN GROUP (BOGOSO & PRESTEA)', 'training', '2020-01-01', 'Date approximative - à corriger après import.', @import_user WHERE NOT EXISTS (SELECT 1 FROM events WHERE title = 'TRAINING ON ACCESS TO INFORMATION FOR CITIZEN GROUP (BOGOSO & PRESTEA)');
INSERT INTO events (title, event_type, start_date, description, created_by) SELECT 'DPI Journalism Fellowship', 'training', '2020-01-01', 'Date approximative - à corriger après import.', @import_user WHERE NOT EXISTS (SELECT 1 FROM events WHERE title = 'DPI Journalism Fellowship');
INSERT INTO events (title, event_type, start_date, description, created_by) SELECT 'NGIJ Fellowship', 'training', '2020-01-01', 'Date approximative - à corriger après import.', @import_user WHERE NOT EXISTS (SELECT 1 FROM events WHERE title = 'NGIJ Fellowship');
INSERT INTO events (title, event_type, start_date, description, created_by) SELECT 'Atelier IFFs (flux financiers illicites)', 'training', '2020-01-01', 'Date approximative - à corriger après import.', @import_user WHERE NOT EXISTS (SELECT 1 FROM events WHERE title = 'Atelier IFFs (flux financiers illicites)');
INSERT INTO events (title, event_type, start_date, description, created_by) SELECT 'Women Empowerment', 'training', '2020-01-01', 'Date approximative - à corriger après import.', @import_user WHERE NOT EXISTS (SELECT 1 FROM events WHERE title = 'Women Empowerment');
