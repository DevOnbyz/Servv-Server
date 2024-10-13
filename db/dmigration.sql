ALTER TABLE resident DROP COLUMN name;
-- Remive forign key constraint
ALTER TABLE resident DROP FOREIGN KEY fk_resident_ibfk_1;
ALTER TABLE resident DROP FOREIGN KEY fk_resident_ibfk_2;
ALTER TABLE resident DROP COLUMN org_id;
ALTER TABLE resident DROP COLUMN ph_num;
ALTER TABLE resident DROP COLUMN project_id;
ALTER TABLE resident ADD COLUMN firstname VARCHAR(255) NOT NULL AFTER id;
ALTER TABLE resident_identity ADD COLUMN created_by INT AFTER id;
ALTER TABLE resident ADD COLUMN lastname VARCHAR(255) NOT NULL AFTER firstname;
DROP TABLE resident;