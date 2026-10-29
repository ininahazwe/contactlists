-- An admin can now create a user account from just an email address,
-- before that person has ever signed in with Google. google_sub is only
-- known once they do, so it must accept NULL until then (MariaDB/MySQL
-- allow any number of NULLs under a UNIQUE index, so uniqueness among
-- accounts that *have* signed in is unaffected).
ALTER TABLE users MODIFY google_sub VARCHAR(255) NULL;
