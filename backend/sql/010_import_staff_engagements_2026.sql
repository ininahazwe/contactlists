-- Import des engagements (voyages, réunions, formations, conférences) depuis l'onglet
-- « Staff engages 2026 » de « MFWA Institutional Development Documents.xlsx ».
--
-- Remplit staff_engagements.country (pays de l'événement) et place (ville / « Online »),
-- et convertit les dates lisibles en start_date / end_date (le texte d'origine reste dans
-- date_text). Les mois seuls (« June ») restent en date_text uniquement.
--
-- Idempotent : supprime d'abord les lignes déjà importées depuis cette feuille
-- (source_sheet = 'Staff engages 2026'), puis les réinsère. Les engagements ajoutés à la
-- main depuis l'interface (source_sheet = 'manual') ne sont pas touchés.
--
-- Chaque staff est retrouvé par son nom (avec ou sans « (PhD) »). Un nom introuvable est
-- ignoré et listé par la requête de contrôle en fin de fichier.

SET @import_user := COALESCE(
  (SELECT id FROM users WHERE role = 'admin' ORDER BY id LIMIT 1),
  (SELECT id FROM users ORDER BY id LIMIT 1));

DELETE FROM staff_engagements WHERE source_sheet = 'Staff engages 2026';

DROP TEMPORARY TABLE IF EXISTS tmp_engagements_unmatched;
CREATE TEMPORARY TABLE tmp_engagements_unmatched (name VARCHAR(255) NOT NULL, rows_skipped INT NOT NULL);

-- Sulemana Braimah (7)
SET @s := (SELECT id FROM staff WHERE full_name IN ('Sulemana Braimah', 'Sulemana Braimah (PhD)') ORDER BY id LIMIT 1);
INSERT INTO tmp_engagements_unmatched SELECT 'Sulemana Braimah', 7 WHERE @s IS NULL;
INSERT INTO staff_engagements (staff_id, engagement_type, country, place, start_date, end_date, date_text, purpose, role_in_engagement, source_sheet, source_year, created_by, updated_by) SELECT @s, 'meeting', 'Ghana', NULL, NULL, NULL, 'February', 'MFWA Board meeting and meeting with the Judicial Service', NULL, 'Staff engages 2026', 2026, @import_user, @import_user WHERE @s IS NOT NULL;
INSERT INTO staff_engagements (staff_id, engagement_type, country, place, start_date, end_date, date_text, purpose, role_in_engagement, source_sheet, source_year, created_by, updated_by) SELECT @s, 'conference', 'Ghana', NULL, NULL, NULL, 'July', 'Civil Society Forum 2026 - Served as a Panellist', 'panelist', 'Staff engages 2026', 2026, @import_user, @import_user WHERE @s IS NOT NULL;
INSERT INTO staff_engagements (staff_id, engagement_type, country, place, start_date, end_date, date_text, purpose, role_in_engagement, source_sheet, source_year, created_by, updated_by) SELECT @s, 'meeting', 'Ghana', NULL, NULL, NULL, 'June', 'Meeting with Sebastian from NED at MFWA Office', NULL, 'Staff engages 2026', 2026, @import_user, @import_user WHERE @s IS NOT NULL;
INSERT INTO staff_engagements (staff_id, engagement_type, country, place, start_date, end_date, date_text, purpose, role_in_engagement, source_sheet, source_year, created_by, updated_by) SELECT @s, 'meeting', 'Ghana', NULL, NULL, NULL, 'June', 'Meeting on Media Regulation in Ghana - bringing together Prof. Karikari, Prof H. K Prempeh of CDD; Prof Amin Alhassan, GBC-DG and MFWA staff', NULL, 'Staff engages 2026', 2026, @import_user, @import_user WHERE @s IS NOT NULL;
INSERT INTO staff_engagements (staff_id, engagement_type, country, place, start_date, end_date, date_text, purpose, role_in_engagement, source_sheet, source_year, created_by, updated_by) SELECT @s, 'meeting', NULL, 'Online', '2026-02-19', NULL, NULL, 'With Liz Baker of Humanity United on potential operation funding', NULL, 'Staff engages 2026', 2026, @import_user, @import_user WHERE @s IS NOT NULL;
INSERT INTO staff_engagements (staff_id, engagement_type, country, place, start_date, end_date, date_text, purpose, role_in_engagement, source_sheet, source_year, created_by, updated_by) SELECT @s, 'training', 'Benin', NULL, '2026-03-03', '2026-03-04', 'March 3-4', 'pre-election training for journalists in Benin by ECOWAS ahead of Benin elections', NULL, 'Staff engages 2026', 2026, @import_user, @import_user WHERE @s IS NOT NULL;
INSERT INTO staff_engagements (staff_id, engagement_type, country, place, start_date, end_date, date_text, purpose, role_in_engagement, source_sheet, source_year, created_by, updated_by) SELECT @s, 'meeting', NULL, 'Online', '2026-02-27', NULL, NULL, 'MFWA/AfDB Potential collaboration meeting', NULL, 'Staff engages 2026', 2026, @import_user, @import_user WHERE @s IS NOT NULL;

-- Dora Boamah Mawutor (5)
SET @s := (SELECT id FROM staff WHERE full_name IN ('Dora Boamah Mawutor', 'Dora Boamah Mawutor (PhD)') ORDER BY id LIMIT 1);
INSERT INTO tmp_engagements_unmatched SELECT 'Dora Boamah Mawutor', 5 WHERE @s IS NULL;
INSERT INTO staff_engagements (staff_id, engagement_type, country, place, start_date, end_date, date_text, purpose, role_in_engagement, source_sheet, source_year, created_by, updated_by) SELECT @s, 'meeting', 'Ghana', NULL, NULL, NULL, 'June', 'Meeting with Sebastian from NED at MFWA Office', NULL, 'Staff engages 2026', 2026, @import_user, @import_user WHERE @s IS NOT NULL;
INSERT INTO staff_engagements (staff_id, engagement_type, country, place, start_date, end_date, date_text, purpose, role_in_engagement, source_sheet, source_year, created_by, updated_by) SELECT @s, 'meeting', 'Ghana', NULL, NULL, NULL, 'June', 'Meeting on Media Regulation in Ghana - bringing together Prof. Karikari, Prof H. K Prempeh of CDD; Prof Amin Alhassan, GBC-DG and MFWA staff', NULL, 'Staff engages 2026', 2026, @import_user, @import_user WHERE @s IS NOT NULL;
INSERT INTO staff_engagements (staff_id, engagement_type, country, place, start_date, end_date, date_text, purpose, role_in_engagement, source_sheet, source_year, created_by, updated_by) SELECT @s, 'meeting', 'Ghana', NULL, '2026-06-18', NULL, NULL, 'Meeting with the UNESCO West Africa Rep', NULL, 'Staff engages 2026', 2026, @import_user, @import_user WHERE @s IS NOT NULL;
INSERT INTO staff_engagements (staff_id, engagement_type, country, place, start_date, end_date, date_text, purpose, role_in_engagement, source_sheet, source_year, created_by, updated_by) SELECT @s, 'meeting', 'Germany', NULL, '2026-06-27', '2026-06-30', 'June 27-30', 'Participate in Pan- Africanism project meetings - Bremen and Volkwagon project', NULL, 'Staff engages 2026', 2026, @import_user, @import_user WHERE @s IS NOT NULL;
INSERT INTO staff_engagements (staff_id, engagement_type, country, place, start_date, end_date, date_text, purpose, role_in_engagement, source_sheet, source_year, created_by, updated_by) SELECT @s, 'meeting', 'USA', NULL, '2026-07-16', '2026-07-28', 'July 16-28', 'Participate in the Global Partners project-related meetings', NULL, 'Staff engages 2026', 2026, @import_user, @import_user WHERE @s IS NOT NULL;

-- Abigail Larbi (6)
SET @s := (SELECT id FROM staff WHERE full_name IN ('Abigail Larbi', 'Abigail Larbi (PhD)') ORDER BY id LIMIT 1);
INSERT INTO tmp_engagements_unmatched SELECT 'Abigail Larbi', 6 WHERE @s IS NULL;
INSERT INTO staff_engagements (staff_id, engagement_type, country, place, start_date, end_date, date_text, purpose, role_in_engagement, source_sheet, source_year, created_by, updated_by) SELECT @s, 'meeting', 'Ghana', NULL, NULL, NULL, 'February', 'MFWA Board meeting and meeting with the Judicial Service', NULL, 'Staff engages 2026', 2026, @import_user, @import_user WHERE @s IS NOT NULL;
INSERT INTO staff_engagements (staff_id, engagement_type, country, place, start_date, end_date, date_text, purpose, role_in_engagement, source_sheet, source_year, created_by, updated_by) SELECT @s, 'meeting', 'Guinea Bissau', NULL, '2026-06-22', '2026-06-27', 'June 22-27', 'Participate in close out activities for EU-funded project', NULL, 'Staff engages 2026', 2026, @import_user, @import_user WHERE @s IS NOT NULL;
INSERT INTO staff_engagements (staff_id, engagement_type, country, place, start_date, end_date, date_text, purpose, role_in_engagement, source_sheet, source_year, created_by, updated_by) SELECT @s, 'meeting', 'Ghana', NULL, NULL, NULL, 'June', 'Meeting with Sebastian from NED at MFWA Office', NULL, 'Staff engages 2026', 2026, @import_user, @import_user WHERE @s IS NOT NULL;
INSERT INTO staff_engagements (staff_id, engagement_type, country, place, start_date, end_date, date_text, purpose, role_in_engagement, source_sheet, source_year, created_by, updated_by) SELECT @s, 'meeting', 'Ghana', NULL, NULL, NULL, 'June', 'Meeting on Media Regulation in Ghana - bringing together Prof. Karikari, Prof H. K Prempeh of CDD; Prof Amin Alhassan, GBC-DG and MFWA staff', NULL, 'Staff engages 2026', 2026, @import_user, @import_user WHERE @s IS NOT NULL;
INSERT INTO staff_engagements (staff_id, engagement_type, country, place, start_date, end_date, date_text, purpose, role_in_engagement, source_sheet, source_year, created_by, updated_by) SELECT @s, 'meeting', 'Ghana', NULL, '2026-03-03', NULL, NULL, 'German Ambassador''s residence - On the occasion of the visit of Mrs. Isabel Hénin, Special Envoy to the Sahel of the German Governmen t', NULL, 'Staff engages 2026', 2026, @import_user, @import_user WHERE @s IS NOT NULL;
INSERT INTO staff_engagements (staff_id, engagement_type, country, place, start_date, end_date, date_text, purpose, role_in_engagement, source_sheet, source_year, created_by, updated_by) SELECT @s, 'meeting', NULL, NULL, NULL, NULL, NULL, 'potential collaboration meeting with Zukiswa White the Operations and Finance Manager at Quote This Woman+ (QW+), a pan-African non-profit registered in South Africa working to increase the representation of women and gender-diverse experts as sources in African media.', NULL, 'Staff engages 2026', 2026, @import_user, @import_user WHERE @s IS NOT NULL;

-- Ed Pitmann (1)
SET @s := (SELECT id FROM staff WHERE full_name IN ('Ed Pitmann', 'Ed Pitmann (PhD)') ORDER BY id LIMIT 1);
INSERT INTO tmp_engagements_unmatched SELECT 'Ed Pitmann', 1 WHERE @s IS NULL;
INSERT INTO staff_engagements (staff_id, engagement_type, country, place, start_date, end_date, date_text, purpose, role_in_engagement, source_sheet, source_year, created_by, updated_by) SELECT @s, 'conference', 'Germany', 'Bonn', '2026-06-21', '2026-06-25', 'June 21-25', 'Participate in Global Media Forum 2026 in Bonn', NULL, 'Staff engages 2026', 2026, @import_user, @import_user WHERE @s IS NOT NULL;

-- Kojo Impraim (PhD) (5)
SET @s := (SELECT id FROM staff WHERE full_name IN ('Kojo Impraim', 'Kojo Impraim (PhD)') ORDER BY id LIMIT 1);
INSERT INTO tmp_engagements_unmatched SELECT 'Kojo Impraim (PhD)', 5 WHERE @s IS NULL;
INSERT INTO staff_engagements (staff_id, engagement_type, country, place, start_date, end_date, date_text, purpose, role_in_engagement, source_sheet, source_year, created_by, updated_by) SELECT @s, 'training', 'Cape Verde', NULL, '2026-01-09', '2026-01-20', 'January 09-20', 'Facilitate ECOWAS trainings on Mis/disinformation', NULL, 'Staff engages 2026', 2026, @import_user, @import_user WHERE @s IS NOT NULL;
INSERT INTO staff_engagements (staff_id, engagement_type, country, place, start_date, end_date, date_text, purpose, role_in_engagement, source_sheet, source_year, created_by, updated_by) SELECT @s, 'training', 'Sierra Leone', NULL, '2026-01-09', '2026-01-20', 'January 09-20', 'Facilitate ECOWAS trainings on Mis/disinformation', NULL, 'Staff engages 2026', 2026, @import_user, @import_user WHERE @s IS NOT NULL;
INSERT INTO staff_engagements (staff_id, engagement_type, country, place, start_date, end_date, date_text, purpose, role_in_engagement, source_sheet, source_year, created_by, updated_by) SELECT @s, 'meeting', 'Ghana', NULL, '2026-03-18', NULL, NULL, 'Annual EU-Civil Society dialogue at the Villa Boutique Hotel, Accra', NULL, 'Staff engages 2026', 2026, @import_user, @import_user WHERE @s IS NOT NULL;
INSERT INTO staff_engagements (staff_id, engagement_type, country, place, start_date, end_date, date_text, purpose, role_in_engagement, source_sheet, source_year, created_by, updated_by) SELECT @s, 'meeting', 'Ghana', NULL, '2026-03-10', '2026-03-14', 'March 10-14', 'OXFAM project partners meeting', NULL, 'Staff engages 2026', 2026, @import_user, @import_user WHERE @s IS NOT NULL;
INSERT INTO staff_engagements (staff_id, engagement_type, country, place, start_date, end_date, date_text, purpose, role_in_engagement, source_sheet, source_year, created_by, updated_by) SELECT @s, 'meeting', 'Ghana', NULL, '2026-05-26', NULL, NULL, 'ECOWAS ENBIC training on Biometric Data', NULL, 'Staff engages 2026', 2026, @import_user, @import_user WHERE @s IS NOT NULL;

-- Vivian Affoah (2)
SET @s := (SELECT id FROM staff WHERE full_name IN ('Vivian Affoah', 'Vivian Affoah (PhD)') ORDER BY id LIMIT 1);
INSERT INTO tmp_engagements_unmatched SELECT 'Vivian Affoah', 2 WHERE @s IS NULL;
INSERT INTO staff_engagements (staff_id, engagement_type, country, place, start_date, end_date, date_text, purpose, role_in_engagement, source_sheet, source_year, created_by, updated_by) SELECT @s, 'meeting', 'Germany', NULL, '2026-06-27', '2026-06-30', 'June 27-30', 'Participate in Pan- Africanism project meetings - Bremen and Volkwagon project', NULL, 'Staff engages 2026', 2026, @import_user, @import_user WHERE @s IS NOT NULL;
INSERT INTO staff_engagements (staff_id, engagement_type, country, place, start_date, end_date, date_text, purpose, role_in_engagement, source_sheet, source_year, created_by, updated_by) SELECT @s, 'conference', 'Switzerland', NULL, '2026-07-04', '2026-07-09', 'July 4 - 9', 'Participate in the Global Dialogue on AI Governance and related side meetings at Palexpo, Geneva', NULL, 'Staff engages 2026', 2026, @import_user, @import_user WHERE @s IS NOT NULL;

-- Adizatu Moro Maiga (2)
SET @s := (SELECT id FROM staff WHERE full_name IN ('Adizatu Moro Maiga', 'Adizatu Moro Maiga (PhD)') ORDER BY id LIMIT 1);
INSERT INTO tmp_engagements_unmatched SELECT 'Adizatu Moro Maiga', 2 WHERE @s IS NULL;
INSERT INTO staff_engagements (staff_id, engagement_type, country, place, start_date, end_date, date_text, purpose, role_in_engagement, source_sheet, source_year, created_by, updated_by) SELECT @s, 'conference', 'Germany', NULL, '2026-06-21', '2026-06-25', 'June 21-25', 'Participate in Global Media Forum 2026 in Bonn', NULL, 'Staff engages 2026', 2026, @import_user, @import_user WHERE @s IS NOT NULL;
INSERT INTO staff_engagements (staff_id, engagement_type, country, place, start_date, end_date, date_text, purpose, role_in_engagement, source_sheet, source_year, created_by, updated_by) SELECT @s, 'meeting', 'Nigeria', NULL, '2026-08-10', '2026-08-14', '10-14 August', 'Engagement with EOCWAS on the establishment of a Youth Parliament', NULL, 'Staff engages 2026', 2026, @import_user, @import_user WHERE @s IS NOT NULL;

-- Kwaku Krobea Asante (10)
SET @s := (SELECT id FROM staff WHERE full_name IN ('Kwaku Krobea Asante', 'Kwaku Krobea Asante (PhD)') ORDER BY id LIMIT 1);
INSERT INTO tmp_engagements_unmatched SELECT 'Kwaku Krobea Asante', 10 WHERE @s IS NULL;
INSERT INTO staff_engagements (staff_id, engagement_type, country, place, start_date, end_date, date_text, purpose, role_in_engagement, source_sheet, source_year, created_by, updated_by) SELECT @s, 'conference', 'Malawi', NULL, '2026-02-01', NULL, NULL, 'Participated in the KAS Media Local Journalism Conference & Awards in Africa', NULL, 'Staff engages 2026', 2026, @import_user, @import_user WHERE @s IS NOT NULL;
INSERT INTO staff_engagements (staff_id, engagement_type, country, place, start_date, end_date, date_text, purpose, role_in_engagement, source_sheet, source_year, created_by, updated_by) SELECT @s, 'conference', 'Belgium', NULL, '2026-04-14', '2026-04-15', '14-15 April, 2026', 'Participated in the Africa FIMI Conference, Brussels', NULL, 'Staff engages 2026', 2026, @import_user, @import_user WHERE @s IS NOT NULL;
INSERT INTO staff_engagements (staff_id, engagement_type, country, place, start_date, end_date, date_text, purpose, role_in_engagement, source_sheet, source_year, created_by, updated_by) SELECT @s, 'conference', 'Italy', NULL, '2026-04-15', '2026-04-18', 'April 15 to 18, 2026', 'The 2025 International Journalism Festival (IJF25) on press freedom, AI in reporting, and investigative independence', NULL, 'Staff engages 2026', 2026, @import_user, @import_user WHERE @s IS NOT NULL;
INSERT INTO staff_engagements (staff_id, engagement_type, country, place, start_date, end_date, date_text, purpose, role_in_engagement, source_sheet, source_year, created_by, updated_by) SELECT @s, 'conference', 'Sweden', NULL, '2025-05-13', '2025-05-14', 'May 13–14, 2025', '12th Annual Stockholm Forum on Democracy, Peace and Development by the Stockholm International Peace Research Institute (SIPRI)', NULL, 'Staff engages 2026', 2025, @import_user, @import_user WHERE @s IS NOT NULL;
INSERT INTO staff_engagements (staff_id, engagement_type, country, place, start_date, end_date, date_text, purpose, role_in_engagement, source_sheet, source_year, created_by, updated_by) SELECT @s, 'conference', 'Nigeria', NULL, '2025-05-01', NULL, NULL, 'Disinformation Dialogue by the Scandinavian countries', NULL, 'Staff engages 2026', 2025, @import_user, @import_user WHERE @s IS NOT NULL;
INSERT INTO staff_engagements (staff_id, engagement_type, country, place, start_date, end_date, date_text, purpose, role_in_engagement, source_sheet, source_year, created_by, updated_by) SELECT @s, 'meeting', 'USA', NULL, NULL, NULL, 'July - August 2025', 'Participated in the US International Visitor Leadership Program (IVLP)', NULL, 'Staff engages 2026', 2025, @import_user, @import_user WHERE @s IS NOT NULL;
INSERT INTO staff_engagements (staff_id, engagement_type, country, place, start_date, end_date, date_text, purpose, role_in_engagement, source_sheet, source_year, created_by, updated_by) SELECT @s, 'travel', 'Togo', NULL, NULL, NULL, NULL, NULL, NULL, 'Staff engages 2026', 2026, @import_user, @import_user WHERE @s IS NOT NULL;
INSERT INTO staff_engagements (staff_id, engagement_type, country, place, start_date, end_date, date_text, purpose, role_in_engagement, source_sheet, source_year, created_by, updated_by) SELECT @s, 'conference', 'Malaysia', NULL, '2025-11-20', '2025-11-24', 'November 20 - 24, 2025', 'Participated in the 14th Global Investigative Journalism Conference (GIJC25)', NULL, 'Staff engages 2026', 2025, @import_user, @import_user WHERE @s IS NOT NULL;
INSERT INTO staff_engagements (staff_id, engagement_type, country, place, start_date, end_date, date_text, purpose, role_in_engagement, source_sheet, source_year, created_by, updated_by) SELECT @s, 'conference', 'South Africa', NULL, '2025-11-05', '2025-11-07', 'November 5 - 7, 2025', 'Participated in the 21st African Investigative Journalism Conference (AIJC) at the University of the Witwatersrand (Wits University)', NULL, 'Staff engages 2026', 2025, @import_user, @import_user WHERE @s IS NOT NULL;
INSERT INTO staff_engagements (staff_id, engagement_type, country, place, start_date, end_date, date_text, purpose, role_in_engagement, source_sheet, source_year, created_by, updated_by) SELECT @s, 'conference', 'Nigeria', NULL, '2025-11-26', NULL, NULL, 'Participated in the 2025 Media and Development Conference and Awards by the Centre for Journalism Innovation and Development (CJID)', NULL, 'Staff engages 2026', 2025, @import_user, @import_user WHERE @s IS NOT NULL;

-- Daniel Ampofo Adjei (3)
SET @s := (SELECT id FROM staff WHERE full_name IN ('Daniel Ampofo Adjei', 'Daniel Ampofo Adjei (PhD)') ORDER BY id LIMIT 1);
INSERT INTO tmp_engagements_unmatched SELECT 'Daniel Ampofo Adjei', 3 WHERE @s IS NULL;
INSERT INTO staff_engagements (staff_id, engagement_type, country, place, start_date, end_date, date_text, purpose, role_in_engagement, source_sheet, source_year, created_by, updated_by) SELECT @s, 'meeting', 'Guinea Bissau', NULL, '2026-06-22', '2026-07-02', 'June 22-Jully 2', 'Participate in close out activities for EU-funded project', NULL, 'Staff engages 2026', 2026, @import_user, @import_user WHERE @s IS NOT NULL;
INSERT INTO staff_engagements (staff_id, engagement_type, country, place, start_date, end_date, date_text, purpose, role_in_engagement, source_sheet, source_year, created_by, updated_by) SELECT @s, 'meeting', 'Ghana', NULL, '2026-05-03', NULL, NULL, 'UNIMAC - GIJ World Press Freedom Day', NULL, 'Staff engages 2026', 2026, @import_user, @import_user WHERE @s IS NOT NULL;
INSERT INTO staff_engagements (staff_id, engagement_type, country, place, start_date, end_date, date_text, purpose, role_in_engagement, source_sheet, source_year, created_by, updated_by) SELECT @s, 'meeting', 'Nigeria', NULL, '2026-08-10', '2026-08-14', 'August 10 - 14, 2026', 'Engagement with ECOWAS on the establishment of a Youth Parliament', NULL, 'Staff engages 2026', 2026, @import_user, @import_user WHERE @s IS NOT NULL;

-- Meshack Odoi (1)
SET @s := (SELECT id FROM staff WHERE full_name IN ('Meshack Odoi', 'Meshack Odoi (PhD)') ORDER BY id LIMIT 1);
INSERT INTO tmp_engagements_unmatched SELECT 'Meshack Odoi', 1 WHERE @s IS NULL;
INSERT INTO staff_engagements (staff_id, engagement_type, country, place, start_date, end_date, date_text, purpose, role_in_engagement, source_sheet, source_year, created_by, updated_by) SELECT @s, 'conference', 'Ghana', NULL, NULL, NULL, NULL, 'Participate in Civil Society Forum Ghana', NULL, 'Staff engages 2026', 2026, @import_user, @import_user WHERE @s IS NOT NULL;

-- Paul Gozo (1)
SET @s := (SELECT id FROM staff WHERE full_name IN ('Paul Gozo', 'Paul Gozo (PhD)') ORDER BY id LIMIT 1);
INSERT INTO tmp_engagements_unmatched SELECT 'Paul Gozo', 1 WHERE @s IS NULL;
INSERT INTO staff_engagements (staff_id, engagement_type, country, place, start_date, end_date, date_text, purpose, role_in_engagement, source_sheet, source_year, created_by, updated_by) SELECT @s, 'meeting', 'Ghana', NULL, '2026-03-11', NULL, NULL, 'The Konrad Adenauer Stiftung, Ghana in collaboration with the Ghana Institute of Management and Public Administration (GIMPA) kindly invites you to a presentation and discussion themed ‘Stocktaking of Ghana’s Democracy: Public Perceptions on Governance, Democratic Values and Political Leadership’. The program is scheduled for Wednesday, 11th March 2026 at the Moot Court, Faculty of Law, GIMPA campus at 10.00am to 12.00 noon. We look forward in welcoming you.', NULL, 'Staff engages 2026', 2026, @import_user, @import_user WHERE @s IS NOT NULL;  -- pays déduit (texte de la ligne)

-- Melvine Enzeng (1)
SET @s := (SELECT id FROM staff WHERE full_name IN ('Melvine Enzeng', 'Melvine Enzeng (PhD)') ORDER BY id LIMIT 1);
INSERT INTO tmp_engagements_unmatched SELECT 'Melvine Enzeng', 1 WHERE @s IS NULL;
INSERT INTO staff_engagements (staff_id, engagement_type, country, place, start_date, end_date, date_text, purpose, role_in_engagement, source_sheet, source_year, created_by, updated_by) SELECT @s, 'training', 'Togo', NULL, '2026-05-20', NULL, NULL, 'Digital Literacy Training Workshop For Female Journalists and Activists In Togo organised by MFWA Launch Of The State Of The World’s Human Rights And Death Penalty Reports 2025', NULL, 'Staff engages 2026', 2026, @import_user, @import_user WHERE @s IS NOT NULL;  -- pays déduit (texte de la ligne)

-- Alice Assibuaba Assibu (2)
SET @s := (SELECT id FROM staff WHERE full_name IN ('Alice Assibuaba Assibu', 'Alice Assibuaba Assibu (PhD)') ORDER BY id LIMIT 1);
INSERT INTO tmp_engagements_unmatched SELECT 'Alice Assibuaba Assibu', 2 WHERE @s IS NULL;
INSERT INTO staff_engagements (staff_id, engagement_type, country, place, start_date, end_date, date_text, purpose, role_in_engagement, source_sheet, source_year, created_by, updated_by) SELECT @s, 'meeting', 'Guinea Bissau', NULL, '2026-06-22', '2026-06-27', 'June 22-27', 'Participate in close out activities for EU-funded project', NULL, 'Staff engages 2026', 2026, @import_user, @import_user WHERE @s IS NOT NULL;  -- pays déduit (même événement que Abigail Larbi)
INSERT INTO staff_engagements (staff_id, engagement_type, country, place, start_date, end_date, date_text, purpose, role_in_engagement, source_sheet, source_year, created_by, updated_by) SELECT @s, 'meeting', 'Germany', NULL, '2026-06-27', '2026-06-30', 'June 27-30', 'Participate in Pan- Africanism project meetings - Bremen and Volkwagon project', NULL, 'Staff engages 2026', 2026, @import_user, @import_user WHERE @s IS NOT NULL;  -- pays déduit (même événement que Dora Boamah Mawutor)

-- James Abbey (2)
SET @s := (SELECT id FROM staff WHERE full_name IN ('James Abbey', 'James Abbey (PhD)') ORDER BY id LIMIT 1);
INSERT INTO tmp_engagements_unmatched SELECT 'James Abbey', 2 WHERE @s IS NULL;
INSERT INTO staff_engagements (staff_id, engagement_type, country, place, start_date, end_date, date_text, purpose, role_in_engagement, source_sheet, source_year, created_by, updated_by) SELECT @s, 'training', 'Ghana', NULL, '2026-02-18', '2026-02-20', 'February 18–20', 'Training on Financial Reporting for journalists in Ghana from at the Airport View Hotel', NULL, 'Staff engages 2026', 2026, @import_user, @import_user WHERE @s IS NOT NULL;  -- pays déduit (texte de la ligne)
INSERT INTO staff_engagements (staff_id, engagement_type, country, place, start_date, end_date, date_text, purpose, role_in_engagement, source_sheet, source_year, created_by, updated_by) SELECT @s, 'travel', 'Ghana', NULL, '2026-07-20', '2026-07-22', 'July 20 - 22', 'Official field assignment to the Northern Region focused on project implementation and documentaries', NULL, 'Staff engages 2026', 2026, @import_user, @import_user WHERE @s IS NOT NULL;  -- pays déduit (texte de la ligne)

-- Contrôle : noms de la feuille sans correspondance dans staff (à rattacher à la main).
SELECT name AS unmatched_name, rows_skipped FROM tmp_engagements_unmatched;

-- Contrôle : engagements importés par staff.
SELECT s.full_name, COUNT(*) AS engagements
FROM staff_engagements e JOIN staff s ON s.id = e.staff_id
WHERE e.source_sheet = 'Staff engages 2026'
GROUP BY s.id, s.full_name ORDER BY s.full_name;

DROP TEMPORARY TABLE IF EXISTS tmp_engagements_unmatched;
