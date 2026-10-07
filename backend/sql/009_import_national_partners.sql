-- Généré depuis « MFWA Institutional Development Documents.xlsx » (onglet « MFWA Key docs »).
-- Idempotent : peut être ré-exécuté sans dupliquer les lignes.

-- Les partenaires nationaux vont dans organizations + contacts (pas de table dédiée).
SET @import_user := (SELECT id FROM users ORDER BY id LIMIT 1);

-- Nigeria : International Press Centre (IPC)
INSERT INTO organizations (name, type, country, notes, created_by) SELECT 'International Press Centre (IPC)', 'Partenaire national MFWA', 'Nigeria', 'National partner for Nigeria', @import_user WHERE NOT EXISTS (SELECT 1 FROM organizations WHERE name = 'International Press Centre (IPC)');
UPDATE organizations SET country = COALESCE(country, 'Nigeria') WHERE name = 'International Press Centre (IPC)';
INSERT INTO contacts (first_name, last_name, email, country, category, organization_id, notes, created_by) SELECT 'Lanre', 'Arogundade', 'larogundade@gmail.com', 'Nigeria', 'civil_society', (SELECT id FROM organizations WHERE name = 'International Press Centre (IPC)' LIMIT 1), NULL, @import_user WHERE NOT EXISTS (SELECT 1 FROM contacts WHERE email = 'larogundade@gmail.com');

-- The Gambia : Gambia Press Union (GPU)
INSERT INTO organizations (name, type, country, notes, created_by) SELECT 'Gambia Press Union (GPU)', 'Partenaire national MFWA', 'The Gambia', 'National partner for The Gambia', @import_user WHERE NOT EXISTS (SELECT 1 FROM organizations WHERE name = 'Gambia Press Union (GPU)');
UPDATE organizations SET country = COALESCE(country, 'The Gambia') WHERE name = 'Gambia Press Union (GPU)';
INSERT INTO contacts (first_name, last_name, email, country, category, organization_id, notes, created_by) SELECT 'Isatou', 'Keita', 'presidentgpu@gmail.com', 'The Gambia', 'civil_society', (SELECT id FROM organizations WHERE name = 'Gambia Press Union (GPU)' LIMIT 1), NULL, @import_user WHERE NOT EXISTS (SELECT 1 FROM contacts WHERE email = 'presidentgpu@gmail.com');

-- Sierra Leone : Media Reform Coordinating Group (MRCG)
INSERT INTO organizations (name, type, country, notes, created_by) SELECT 'Media Reform Coordinating Group (MRCG)', 'Partenaire national MFWA', 'Sierra Leone', 'National partner for Sierra Leone', @import_user WHERE NOT EXISTS (SELECT 1 FROM organizations WHERE name = 'Media Reform Coordinating Group (MRCG)');
UPDATE organizations SET country = COALESCE(country, 'Sierra Leone') WHERE name = 'Media Reform Coordinating Group (MRCG)';
INSERT INTO contacts (first_name, last_name, email, country, category, organization_id, notes, created_by) SELECT 'Francis', 'Sowa', 'sowa2007@yahoo.com', 'Sierra Leone', 'civil_society', (SELECT id FROM organizations WHERE name = 'Media Reform Coordinating Group (MRCG)' LIMIT 1), NULL, @import_user WHERE NOT EXISTS (SELECT 1 FROM contacts WHERE email = 'sowa2007@yahoo.com');

-- Liberia : Center for Media Studies and Peacebuilding (CEMESP)
INSERT INTO organizations (name, type, country, notes, created_by) SELECT 'Center for Media Studies and Peacebuilding (CEMESP)', 'Partenaire national MFWA', 'Liberia', 'National partner for Liberia', @import_user WHERE NOT EXISTS (SELECT 1 FROM organizations WHERE name = 'Center for Media Studies and Peacebuilding (CEMESP)');
UPDATE organizations SET country = COALESCE(country, 'Liberia') WHERE name = 'Center for Media Studies and Peacebuilding (CEMESP)';
INSERT INTO contacts (first_name, last_name, email, country, category, organization_id, notes, created_by) SELECT 'Malcolm', 'Joseph', 'wleemongarjoseph@gmail.com', 'Liberia', 'civil_society', (SELECT id FROM organizations WHERE name = 'Center for Media Studies and Peacebuilding (CEMESP)' LIMIT 1), NULL, @import_user WHERE NOT EXISTS (SELECT 1 FROM contacts WHERE email = 'wleemongarjoseph@gmail.com');

-- Togo : Union des Journalistes Indépendants du Togo (UJIT)
INSERT INTO organizations (name, type, country, notes, created_by) SELECT 'Union des Journalistes Indépendants du Togo (UJIT)', 'Partenaire national MFWA', 'Togo', 'National partner for Togo', @import_user WHERE NOT EXISTS (SELECT 1 FROM organizations WHERE name = 'Union des Journalistes Indépendants du Togo (UJIT)');
UPDATE organizations SET country = COALESCE(country, 'Togo') WHERE name = 'Union des Journalistes Indépendants du Togo (UJIT)';
INSERT INTO contacts (first_name, last_name, email, country, category, organization_id, notes, created_by) SELECT 'Eli', 'Goka', 'eligoka@gmail.com', 'Togo', 'civil_society', (SELECT id FROM organizations WHERE name = 'Union des Journalistes Indépendants du Togo (UJIT)' LIMIT 1), NULL, @import_user WHERE NOT EXISTS (SELECT 1 FROM contacts WHERE email = 'eligoka@gmail.com');

-- Senegal : Syndicat des Professionnels de l’Information et de la Communication du Sénégal (SYNPICS)
INSERT INTO organizations (name, type, country, notes, created_by) SELECT 'Syndicat des Professionnels de l’Information et de la Communication du Sénégal (SYNPICS)', 'Partenaire national MFWA', 'Senegal', '1st national partner for Senegal', @import_user WHERE NOT EXISTS (SELECT 1 FROM organizations WHERE name = 'Syndicat des Professionnels de l’Information et de la Communication du Sénégal (SYNPICS)');
UPDATE organizations SET country = COALESCE(country, 'Senegal') WHERE name = 'Syndicat des Professionnels de l’Information et de la Communication du Sénégal (SYNPICS)';
INSERT INTO contacts (first_name, last_name, email, country, category, organization_id, notes, created_by) SELECT 'Amadou', 'Bamba Kasse', 'bambakasse@gmail.com', 'Senegal', 'civil_society', (SELECT id FROM organizations WHERE name = 'Syndicat des Professionnels de l’Information et de la Communication du Sénégal (SYNPICS)' LIMIT 1), NULL, @import_user WHERE NOT EXISTS (SELECT 1 FROM contacts WHERE email = 'bambakasse@gmail.com');

-- Senegal : Africtivistes
INSERT INTO organizations (name, type, country, notes, created_by) SELECT 'Africtivistes', 'Partenaire national MFWA', 'Senegal', '2nd national partner for Senegal', @import_user WHERE NOT EXISTS (SELECT 1 FROM organizations WHERE name = 'Africtivistes');
UPDATE organizations SET country = COALESCE(country, 'Senegal') WHERE name = 'Africtivistes';
INSERT INTO contacts (first_name, last_name, email, country, category, organization_id, notes, created_by) SELECT 'Cheikh', 'Fall', NULL, 'Senegal', 'civil_society', (SELECT id FROM organizations WHERE name = 'Africtivistes' LIMIT 1), NULL, @import_user WHERE NOT EXISTS (SELECT 1 FROM contacts WHERE first_name = 'Cheikh' AND last_name = 'Fall' AND organization_id = (SELECT id FROM organizations WHERE name = 'Africtivistes' LIMIT 1));
INSERT INTO contacts (first_name, last_name, email, country, category, organization_id, notes, created_by) SELECT 'Aisha', 'Dabo', NULL, 'Senegal', 'civil_society', (SELECT id FROM organizations WHERE name = 'Africtivistes' LIMIT 1), NULL, @import_user WHERE NOT EXISTS (SELECT 1 FROM contacts WHERE first_name = 'Aisha' AND last_name = 'Dabo' AND organization_id = (SELECT id FROM organizations WHERE name = 'Africtivistes' LIMIT 1));

-- Côte d'Ivoire : Observatoire de la Liberté de la Presse, l’Ethique et de la Déontologie (OLPED)
INSERT INTO organizations (name, type, country, notes, created_by) SELECT 'Observatoire de la Liberté de la Presse, l’Ethique et de la Déontologie (OLPED)', 'Partenaire national MFWA', 'Côte d''Ivoire', 'National partner for Côte d''Ivoire', @import_user WHERE NOT EXISTS (SELECT 1 FROM organizations WHERE name = 'Observatoire de la Liberté de la Presse, l’Ethique et de la Déontologie (OLPED)');
UPDATE organizations SET country = COALESCE(country, 'Côte d''Ivoire') WHERE name = 'Observatoire de la Liberté de la Presse, l’Ethique et de la Déontologie (OLPED)';
INSERT INTO contacts (first_name, last_name, email, country, category, organization_id, notes, created_by) SELECT 'Ousmane', 'Sy Savane', 'osysavane@hotmail.com', 'Côte d''Ivoire', 'civil_society', (SELECT id FROM organizations WHERE name = 'Observatoire de la Liberté de la Presse, l’Ethique et de la Déontologie (OLPED)' LIMIT 1), NULL, @import_user WHERE NOT EXISTS (SELECT 1 FROM contacts WHERE email = 'osysavane@hotmail.com');

-- Benin : Observatoire de la Déontologie et de l’Ethique dans les Medias (ODEM)
INSERT INTO organizations (name, type, country, notes, created_by) SELECT 'Observatoire de la Déontologie et de l’Ethique dans les Medias (ODEM)', 'Partenaire national MFWA', 'Benin', 'National partner for Benin', @import_user WHERE NOT EXISTS (SELECT 1 FROM organizations WHERE name = 'Observatoire de la Déontologie et de l’Ethique dans les Medias (ODEM)');
UPDATE organizations SET country = COALESCE(country, 'Benin') WHERE name = 'Observatoire de la Déontologie et de l’Ethique dans les Medias (ODEM)';
INSERT INTO contacts (first_name, last_name, email, country, category, organization_id, notes, created_by) SELECT 'Ulrich', 'Ahotondji', 'ahotondjiulrichvital@gmail.com', 'Benin', 'civil_society', (SELECT id FROM organizations WHERE name = 'Observatoire de la Déontologie et de l’Ethique dans les Medias (ODEM)' LIMIT 1), NULL, @import_user WHERE NOT EXISTS (SELECT 1 FROM contacts WHERE email = 'ahotondjiulrichvital@gmail.com');

-- Guinea Conakry : Association Guinéenne des éditeurs de la Presse Indépendante (AGEPI)
INSERT INTO organizations (name, type, country, notes, created_by) SELECT 'Association Guinéenne des éditeurs de la Presse Indépendante (AGEPI)', 'Partenaire national MFWA', 'Guinea Conakry', '1st national partner for Guinea Conakry. Remarks (source file): Change in leadership; No contact to the new people', @import_user WHERE NOT EXISTS (SELECT 1 FROM organizations WHERE name = 'Association Guinéenne des éditeurs de la Presse Indépendante (AGEPI)');
UPDATE organizations SET country = COALESCE(country, 'Guinea Conakry') WHERE name = 'Association Guinéenne des éditeurs de la Presse Indépendante (AGEPI)';
INSERT INTO contacts (first_name, last_name, email, country, category, organization_id, notes, created_by) SELECT 'Moussa', 'Iboun Conte', 'contibounmohamed@gmail.com', 'Guinea Conakry', 'civil_society', (SELECT id FROM organizations WHERE name = 'Association Guinéenne des éditeurs de la Presse Indépendante (AGEPI)' LIMIT 1), NULL, @import_user WHERE NOT EXISTS (SELECT 1 FROM contacts WHERE email = 'contibounmohamed@gmail.com');

-- Guinea Conakry : Syndicat des Professionnels de la Presse de Guinée (2024-2025)
INSERT INTO organizations (name, type, country, notes, created_by) SELECT 'Syndicat des Professionnels de la Presse de Guinée (2024-2025)', 'Partenaire national MFWA', 'Guinea Conakry', '2nd national partner for Guinea Conakry. Remarks (source file): Not sure MoU signed with them yet', @import_user WHERE NOT EXISTS (SELECT 1 FROM organizations WHERE name = 'Syndicat des Professionnels de la Presse de Guinée (2024-2025)');
UPDATE organizations SET country = COALESCE(country, 'Guinea Conakry') WHERE name = 'Syndicat des Professionnels de la Presse de Guinée (2024-2025)';
INSERT INTO contacts (first_name, last_name, email, country, category, organization_id, notes, created_by) SELECT 'Sekou', 'Jamal Pendessa', 'sekoujamalpendessa@gmail.com', 'Guinea Conakry', 'civil_society', (SELECT id FROM organizations WHERE name = 'Syndicat des Professionnels de la Presse de Guinée (2024-2025)' LIMIT 1), NULL, @import_user WHERE NOT EXISTS (SELECT 1 FROM contacts WHERE email = 'sekoujamalpendessa@gmail.com');

-- Mauritania : Regroupement de la Presse Mauritanienne (Mauritania)
INSERT INTO organizations (name, type, country, notes, created_by) SELECT 'Regroupement de la Presse Mauritanienne (Mauritania)', 'Partenaire national MFWA', 'Mauritania', 'National partner for Mauritania', @import_user WHERE NOT EXISTS (SELECT 1 FROM organizations WHERE name = 'Regroupement de la Presse Mauritanienne (Mauritania)');
UPDATE organizations SET country = COALESCE(country, 'Mauritania') WHERE name = 'Regroupement de la Presse Mauritanienne (Mauritania)';
INSERT INTO contacts (first_name, last_name, email, country, category, organization_id, notes, created_by) SELECT 'Moussa', 'Ould Samba Sy', 'ouldsambasy@yahoo.fr', 'Mauritania', 'civil_society', (SELECT id FROM organizations WHERE name = 'Regroupement de la Presse Mauritanienne (Mauritania)' LIMIT 1), NULL, @import_user WHERE NOT EXISTS (SELECT 1 FROM contacts WHERE email = 'ouldsambasy@yahoo.fr');

-- Mali : Maison de la Presse du Mali
INSERT INTO organizations (name, type, country, notes, created_by) SELECT 'Maison de la Presse du Mali', 'Partenaire national MFWA', 'Mali', '1st national partner for Mali', @import_user WHERE NOT EXISTS (SELECT 1 FROM organizations WHERE name = 'Maison de la Presse du Mali');
UPDATE organizations SET country = COALESCE(country, 'Mali') WHERE name = 'Maison de la Presse du Mali';
INSERT INTO contacts (first_name, last_name, email, country, category, organization_id, notes, created_by) SELECT 'Dante', 'Bandiougou', 'dantebandiougou@yahoo.fr', 'Mali', 'civil_society', (SELECT id FROM organizations WHERE name = 'Maison de la Presse du Mali' LIMIT 1), NULL, @import_user WHERE NOT EXISTS (SELECT 1 FROM contacts WHERE email = 'dantebandiougou@yahoo.fr');
INSERT INTO contacts (first_name, last_name, email, country, category, organization_id, notes, created_by) SELECT 'Talata', 'Maiga', 'm.talata@gmail.com', 'Mali', 'civil_society', (SELECT id FROM organizations WHERE name = 'Maison de la Presse du Mali' LIMIT 1), NULL, @import_user WHERE NOT EXISTS (SELECT 1 FROM contacts WHERE email = 'm.talata@gmail.com');

-- Mali : Tuwindi
INSERT INTO organizations (name, type, country, notes, created_by) SELECT 'Tuwindi', 'Partenaire national MFWA', 'Mali', '2nd national partner for Mali', @import_user WHERE NOT EXISTS (SELECT 1 FROM organizations WHERE name = 'Tuwindi');
UPDATE organizations SET country = COALESCE(country, 'Mali') WHERE name = 'Tuwindi';
INSERT INTO contacts (first_name, last_name, email, country, category, organization_id, notes, created_by) SELECT 'Togolaa', '-', NULL, 'Mali', 'civil_society', (SELECT id FROM organizations WHERE name = 'Tuwindi' LIMIT 1), NULL, @import_user WHERE NOT EXISTS (SELECT 1 FROM contacts WHERE first_name = 'Togolaa' AND last_name = '-' AND organization_id = (SELECT id FROM organizations WHERE name = 'Tuwindi' LIMIT 1));

-- Burkina Faso : Centre National de Presse – Norbert Zongo (CNP-NZ)
INSERT INTO organizations (name, type, country, notes, created_by) SELECT 'Centre National de Presse – Norbert Zongo (CNP-NZ)', 'Partenaire national MFWA', 'Burkina Faso', 'National partner for Burkina Faso', @import_user WHERE NOT EXISTS (SELECT 1 FROM organizations WHERE name = 'Centre National de Presse – Norbert Zongo (CNP-NZ)');
UPDATE organizations SET country = COALESCE(country, 'Burkina Faso') WHERE name = 'Centre National de Presse – Norbert Zongo (CNP-NZ)';
INSERT INTO contacts (first_name, last_name, email, country, category, organization_id, notes, created_by) SELECT 'Abdoulaye', 'Diallo', NULL, 'Burkina Faso', 'civil_society', (SELECT id FROM organizations WHERE name = 'Centre National de Presse – Norbert Zongo (CNP-NZ)' LIMIT 1), 'Email in source file (not attributable to one person): micailou@yahoo.fr', @import_user WHERE NOT EXISTS (SELECT 1 FROM contacts WHERE first_name = 'Abdoulaye' AND last_name = 'Diallo' AND organization_id = (SELECT id FROM organizations WHERE name = 'Centre National de Presse – Norbert Zongo (CNP-NZ)' LIMIT 1));
INSERT INTO contacts (first_name, last_name, email, country, category, organization_id, notes, created_by) SELECT 'Boukary', 'Ouoba', NULL, 'Burkina Faso', 'civil_society', (SELECT id FROM organizations WHERE name = 'Centre National de Presse – Norbert Zongo (CNP-NZ)' LIMIT 1), 'Email in source file (not attributable to one person): micailou@yahoo.fr', @import_user WHERE NOT EXISTS (SELECT 1 FROM contacts WHERE first_name = 'Boukary' AND last_name = 'Ouoba' AND organization_id = (SELECT id FROM organizations WHERE name = 'Centre National de Presse – Norbert Zongo (CNP-NZ)' LIMIT 1));

-- Niger : Observatoire Nigérien Indépendant des Medias (ONIMED)
INSERT INTO organizations (name, type, country, notes, created_by) SELECT 'Observatoire Nigérien Indépendant des Medias (ONIMED)', 'Partenaire national MFWA', 'Niger', 'National partner for Niger', @import_user WHERE NOT EXISTS (SELECT 1 FROM organizations WHERE name = 'Observatoire Nigérien Indépendant des Medias (ONIMED)');
UPDATE organizations SET country = COALESCE(country, 'Niger') WHERE name = 'Observatoire Nigérien Indépendant des Medias (ONIMED)';
INSERT INTO contacts (first_name, last_name, email, country, category, organization_id, notes, created_by) SELECT 'Assane', 'Soumana', 'soumanassane96@gmail.com', 'Niger', 'civil_society', (SELECT id FROM organizations WHERE name = 'Observatoire Nigérien Indépendant des Medias (ONIMED)' LIMIT 1), NULL, @import_user WHERE NOT EXISTS (SELECT 1 FROM contacts WHERE email = 'soumanassane96@gmail.com');

-- Guinea Bissau : Sindicato De Jornalistas e Tecnicos De Comunicacao Social Guinea Bissau (SINJOTECS)
INSERT INTO organizations (name, type, country, notes, created_by) SELECT 'Sindicato De Jornalistas e Tecnicos De Comunicacao Social Guinea Bissau (SINJOTECS)', 'Partenaire national MFWA', 'Guinea Bissau', 'National partner for Guinea Bissau', @import_user WHERE NOT EXISTS (SELECT 1 FROM organizations WHERE name = 'Sindicato De Jornalistas e Tecnicos De Comunicacao Social Guinea Bissau (SINJOTECS)');
UPDATE organizations SET country = COALESCE(country, 'Guinea Bissau') WHERE name = 'Sindicato De Jornalistas e Tecnicos De Comunicacao Social Guinea Bissau (SINJOTECS)';
INSERT INTO contacts (first_name, last_name, email, country, category, organization_id, notes, created_by) SELECT 'Indira', 'Correia Baldé', 'leocorreiabalde@gmail.com', 'Guinea Bissau', 'civil_society', (SELECT id FROM organizations WHERE name = 'Sindicato De Jornalistas e Tecnicos De Comunicacao Social Guinea Bissau (SINJOTECS)' LIMIT 1), NULL, @import_user WHERE NOT EXISTS (SELECT 1 FROM contacts WHERE email = 'leocorreiabalde@gmail.com');

-- Cape Verde : Associação Sindical dos Jornalistas de Cabo Verde (AJOC)
INSERT INTO organizations (name, type, country, notes, created_by) SELECT 'Associação Sindical dos Jornalistas de Cabo Verde (AJOC)', 'Partenaire national MFWA', 'Cape Verde', 'National partner for Cape Verde', @import_user WHERE NOT EXISTS (SELECT 1 FROM organizations WHERE name = 'Associação Sindical dos Jornalistas de Cabo Verde (AJOC)');
UPDATE organizations SET country = COALESCE(country, 'Cape Verde') WHERE name = 'Associação Sindical dos Jornalistas de Cabo Verde (AJOC)';
INSERT INTO contacts (first_name, last_name, email, country, category, organization_id, notes, created_by) SELECT 'Geremias', 'Furtado', 'sfurtadog@gmail.com', 'Cape Verde', 'civil_society', (SELECT id FROM organizations WHERE name = 'Associação Sindical dos Jornalistas de Cabo Verde (AJOC)' LIMIT 1), NULL, @import_user WHERE NOT EXISTS (SELECT 1 FROM contacts WHERE email = 'sfurtadog@gmail.com');

