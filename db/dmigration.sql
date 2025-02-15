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

--27-11-2024 
ALTER TABLE estimate ADD COLUMN `approved_rejected_by` INT DEFAULT NULL;
ALTER TABLE estimate ADD COLUMN `approved_rejected_by_type` TINYINT DEFAULT 0;
ALTER TABLE invoice ADD COLUMN `approved_rejected_by` INT DEFAULT NULL;
ALTER TABLE invoice ADD COLUMN `approved_rejected_by_type` TINYINT DEFAULT 0;
ALTER TABLE issue CHANGE COLUMN `preferred_date` `customer_preferred_time` DATETIME DEFAULT NULL;

-- 28-11-2024
ALTER TABLE `agent_assignment` ADD COLUMN `type` TINYINT DEFAULT NULL AFTER status;
-- 03-12-2024
ALTER TABLE issue DROP COLUMN scheduled_time;
ALTER TABLE `issue` ADD COLUMN `initial_activity_time` DATETIME AFTER customer_preferred_time;
ALTER TABLE announcement ADD COLUMN `filename` TEXT DEFAULT NULL AFTER `img_src`;
ALTER TABLE invoice ADD COLUMN `collected_by` VARCHAR(255) DEFAULT NULL AFTER `total_charge`;
ALTER TABLE invoice ADD COLUMN `payment_mode` TINYINT DEFAULT NULL AFTER `collected_by`;

-- 07-12-2024
ALTER TABLE report ADD COLUMN download_path TEXT AFTER filename;
ALTER TABLE `report` CHANGE `start_date` `start_date` TIMESTAMP NULL;
ALTER TABLE `report` CHANGE `end_date` `end_date` TIMESTAMP NULL;

-- 11-12-2024
ALTER TABLE `organisation` ADD COLUMN `razorpay_customer_id` VARCHAR(255) DEFAULT NULL AFTER `domain`;
ALTER TABLE `organisation` ADD COLUMN `razorpay_route_account_id` VARCHAR(255) DEFAULT NULL AFTER `razorpay_customer_id`;
-- 13-12-2024
ALTER TABLE agent_assignment ADD COLUMN is_satisfied TINYINT DEFAULT 0 AFTER updated_by;
ALTER TABLE agent_assignment ADD COLUMN feedback_comments TEXT DEFAULT NULL AFTER is_satisfied;

-- 16-12-2024
ALTER TABLE issue ADD COLUMN reviewed TINYINT DEFAULT 0 AFTER rating;

-- 03-1-2025
ALTER TABLE agent_assignment
DROP FOREIGN KEY fk_agent_assignment_ibfk_3,
DROP FOREIGN KEY fk_agent_assignment_ibfk_4;

ALTER TABLE agent_assignment
ADD CONSTRAINT fk_agent_assignment_ibfk_3 FOREIGN KEY (created_by) REFERENCES agent (id) ON DELETE CASCADE,
ADD CONSTRAINT fk_agent_assignment_ibfk_4 FOREIGN KEY (updated_by) REFERENCES agent (id) ON DELETE CASCADE;

-- 04-01-2025
ALTER TABLE resident MODIFY COLUMN `lastname` VARCHAR(255) NULL;

-- 05-01-2025
ALTER TABLE resident MODIFY COLUMN `identity_id` INT NOT NULL;

--14-01-2025 already updated in production and dev
ALTER TABLE payment MODIFY COLUMN transfer_id VARCHAR(255) NULL;
ALTER TABLE payment ADD COLUMN org_id INT NOT NULL AFTER id;

--16-01-2025
ALTER TABLE `issue_event` MODIFY COLUMN `event_time` DATETIME DEFAULT NULL;
ALTER TABLE `agent_assignment` DROP COLUMN `assigned_time`;

--18-01-2025
ALTER TABLE `estimate` ADD COLUMN `reject_reason` TEXT DEFAULT NULL AFTER `updated_by`;

--21-01-2025
ALTER TABLE `role` ADD COLUMN `user_type` TINYINT NOT NULL AFTER `org_id`;
ALTER TABLE `role` MODIFY COLUMN `updated_by` INT DEFAULT NULL;
ALTER TABLE `role` ADD COLUMN `created_by` INT DEFAULT NULL AFTER `user_type`;
ALTER TABLE `role` ADD UNIQUE (`org_id`, `name`);

ALTER TABLE `permission` DROP FOREIGN KEY fk_permission_ibfk_1;
ALTER TABLE `permission` DROP COLUMN `org_id`;
ALTER TABLE `permission` ADD COLUMN `created_by` INT DEFAULT NULL AFTER `code`;
ALTER TABLE `permission` MODIFY COLUMN `updated_by` INT DEFAULT NULL;

--insert roles in org_id  1
INSERT INTO `role` (`name`, `org_id`, `user_type`, `created_by`, `updated_by`) 
VALUES 
('Manager', 1, 0, NULL, NULL),
('Technician', 1, 1, NULL, NULL),
('Supervisor', 1, 1, NULL, NULL);

--insert roles in org_id  1

INSERT INTO `permission` (`name`, `code`) 
VALUES 
('Create Invoice', 'CREATE_INVOICE'),
('Approve Invoice', 'APPROVE_INVOICE'),
('Reject Invoice', 'REJECT_INVOICE'),
('Add Technician', 'ADD_TECHNICIAN'),
('Complete Work Order', 'COMPLETE_WORK_ORDER');


INSERT INTO `role_permission_rel` (`role_id`, `permission_id`)
VALUES 
(1, 1), -- Manager: Create Invoice
(1, 2), -- Manager: Approve Invoice
(1, 3), -- Manager: Reject Invoice
(3, 4), -- Supervisor: Add Technician
(2, 5); -- Technician: Complete Work Order


ALTER TABLE `agent` ADD COLUMN `role_id` INT;
ALTER TABLE `agent` ADD CONSTRAINT `fk_agent_ibfk_5` FOREIGN KEY (`role_id`) REFERENCES `role` (`id`) ON DELETE CASCADE;

--21-01-2025
ALTER TABLE `issue_event` ADD COLUMN `info` JSON AFTER description;
