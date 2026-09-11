-- Adds the 'read' value to audit_log.action, so that opening a record can be
-- logged alongside changes.
--
-- Safe on a populated table: widening an ENUM rewrites no data, existing rows
-- keep their value, and running this file twice is a no-op.

ALTER TABLE audit_log
  MODIFY COLUMN action ENUM('create', 'update', 'delete', 'login', 'read') NOT NULL;
