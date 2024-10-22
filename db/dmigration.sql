ALTER TABLE apartment MODIFY COLUMN `name` VARCHAR(255) NULL;
ALTER TABLE apartment ADD COLUMN `status` TINYINT DEFAULT 1 AFTER name;
ALTER TABLE resident ADD COLUMN `status` TINYINT DEFAULT 1 AFTER email_id;
-- 22-12-2014
ALTER TABLE resident ADD COLUMN `org_id` INT AFTER `status`;
ALTER TABLE resident ADD CONSTRAINT fk_resident_ibfk_4 FOREIGN KEY (`org_id`) REFERENCES `organisation`(`id`);