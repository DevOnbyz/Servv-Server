ALTER TABLE apartment MODIFY COLUMN `name` VARCHAR(255) NULL;
ALTER TABLE apartment ADD COLUMN `status` TINYINT DEFAULT 1 AFTER name;
ALTER TABLE resident ADD COLUMN `status` TINYINT DEFAULT 1 AFTER email_id;
-- 22-12-2014
ALTER TABLE resident ADD COLUMN `org_id` INT AFTER `status`;
ALTER TABLE resident ADD CONSTRAINT fk_resident_ibfk_4 FOREIGN KEY (`org_id`) REFERENCES `organisation`(`id`);
ALTER TABLE resident ADD COLUMN `org_id` INT AFTER `status`;

ALTER TABLE admin drop column `name`;
ALTER TABLE admin ADD COLUMN `firstname` VARCHAR(100) NOT NULL AFTER `id`;
ALTER TABLE admin ADD COLUMN `lastname` VARCHAR(100) NOT NULL AFTER `firstname`;
ALTER TABLE admin ADD COLUMN `email` VARCHAR(100)  AFTER `lastname`;
ALTER TABLE admin ADD COLUMN `ph_num` VARCHAR(30)  AFTER `email`;

-- 10-11-24
ALTER TABLE agent drop column `name`;
ALTER TABLE agent drop column `ph_num`;
ALTER TABLE agent drop column `location`;
ALTER TABLE agent drop column `email`;
ALTER TABLE agent drop column `proficient_service`;
ALTER TABLE agent ADD COLUMN `identity_id` INT NOT NULL AFTER `id`;
ALTER TABLE agent ADD COLUMN `firstname` VARCHAR(100) NOT NULL AFTER `identity_id`;
ALTER TABLE agent ADD COLUMN `lastname` VARCHAR(100) NOT NULL AFTER `firstname`;
ALTER TABLE agent ADD COLUMN `email_id` VARCHAR(255)  AFTER `lastname`;
ALTER TABLE agent ADD COLUMN `city` VARCHAR(255)  AFTER `email_id`;
ALTER TABLE agent ADD COLUMN `district` VARCHAR(255)  AFTER `city`;
ALTER TABLE agent ADD COLUMN `state` VARCHAR(255)  AFTER `district`;
ALTER TABLE agent ADD COLUMN `country` VARCHAR(255)  AFTER `state`;
ALTER TABLE agent ADD COLUMN `org_id` INT AFTER `email`;
ALTER TABLE agent ADD CONSTRAINT fk_agent_ibfk_3 FOREIGN KEY (`identity_id`) REFERENCES `agent_identity`(`id`);
ALTER TABLE agent ADD CONSTRAINT fk_agent_ibfk_4 FOREIGN KEY (`org_id`) REFERENCES `organisation`(`id`);
drop table agent_organisation_rel;


-- 10-11-2024
ALTER TABLE issue_event ADD COLUMN `entity_id` INT DEFAULT NULL AFTER `status`;
ALTER TABLE issue ADD COLUMN `sub_status` TINYINT DEFAULT 0 AFTER `status`;
ALTER TABLE agent_assignment ADD COLUMN `status` TINYINT DEFAULT 0 AFTER `agent_id`;
ALTER TABLE agent_assignment ADD COLUMN `notes` TEXT AFTER `status`;
ALTER TABLE agent_assignment DROP COLUMN `job_type`;
ALTER TABLE agent_assignment ADD COLUMN `agent_inferences` TEXT AFTER `otp_code`;
ALTER TABLE agent_assignment ADD COLUMN `agent_uploads` TEXT AFTER `agent_inferences`;
ALTER TABLE issue_event CHANGE COLUMN `status` `sub_status` TINYINT DEFAULT NULL;

-- 21-11-2024
ALTER TABLE estimate ADD COLUMN `created_by` INT DEFAULT NULL;
ALTER TABLE estimate ADD CONSTRAINT fk_estimate_ibfk_2 FOREIGN KEY (`created_by`) REFERENCES `admin`(`id`);

ALTER TABLE estimate ADD COLUMN `updated_by` INT DEFAULT NULL;
ALTER TABLE estimate ADD CONSTRAINT fk_estimate_ibfk_3 FOREIGN KEY (`updated_by`) REFERENCES `admin`(`id`);

ALTER TABLE agent_assignment ADD COLUMN `created_by` INT DEFAULT NULL;
ALTER TABLE agent_assignment ADD COLUMN `updated_by` INT DEFAULT NULL;
ALTER TABLE agent_assignment ADD CONSTRAINT `fk_agent_assignment_ibfk_3` FOREIGN KEY (`created_by`) REFERENCES `admin`(`id`);
ALTER TABLE agent_assignment ADD CONSTRAINT `fk_agent_assignment_ibfk_4` FOREIGN KEY (`updated_by`) REFERENCES `admin`(`id`);

ALTER TABLE estimate ADD COLUMN `filename` TEXT DEFAULT NULL AFTER `src`;
ALTER TABLE invoice ADD COLUMN `filename` TEXT DEFAULT NULL AFTER `src`;
ALTER TABLE issue CHANGE COLUMN `preferred_time` `scheduled_time` DATETIME DEFAULT NULL;

ALTER TABLE issue DROP COLUMN due_date;
ALTER TABLE invoice ADD COLUMN `created_by` INT DEFAULT NULL;
ALTER TABLE invoice ADD CONSTRAINT fk_invoice_ibfk_2 FOREIGN KEY (`created_by`) REFERENCES `admin`(`id`);

ALTER TABLE invoice ADD COLUMN `updated_by` INT DEFAULT NULL;
ALTER TABLE invoice ADD CONSTRAINT fk_invoice_ibfk_3 FOREIGN KEY (`updated_by`) REFERENCES `admin`(`id`);