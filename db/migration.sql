-- Active: 1718928938023@@127.0.0.1@3306@servv_residence
CREATE DATABASE `servv_residence` character set utf8mb4;

use `servv_residence`;

CREATE TABLE `organisation` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(255) NOT NULL,
    `domain` VARCHAR(255) UNIQUE NOT NULL,
    `razorpay_customer_id` VARCHAR(255) DEFAULT NULL,
    `config` JSON,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
CREATE TABLE `role` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(255) NOT NULL,
    `org_id` INT,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_by` INT,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT `fk_role_ibfk_1` FOREIGN KEY (org_id) REFERENCES organisation (id) ON DELETE CASCADE
);

CREATE TABLE `permission` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(255) NOT NULL,
    `code` VARCHAR(255) NOT NULL,
    `org_id` INT,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_by` INT,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT `fk_permission_ibfk_1` FOREIGN KEY (org_id) REFERENCES organisation (id) ON DELETE CASCADE
);

CREATE TABLE `role_permission_rel` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `role_id` INT,
    `permission_id` INT,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `fk_role_permission_ibfk_1` FOREIGN KEY (role_id) REFERENCES role (id) ON DELETE CASCADE,
    CONSTRAINT `fk_role_permission_ibfk_2` FOREIGN KEY (permission_id) REFERENCES permission (id) ON DELETE CASCADE
);

CREATE TABLE `admin` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `firstname` VARCHAR(100) NOT NULL,
    `lastname` VARCHAR(100) NOT NULL,
    `email` VARCHAR(100),
    `ph_num` VARCHAR(30) NOT NULL,
    `username` VARCHAR(255) UNIQUE NOT NULL,
    `password` VARCHAR(255) NOT NULL,
    `org_id` INT NOT NULL,
    `project_id` JSON DEFAULT NULL,
    `status` TINYINT DEFAULT 1,
    `reports_to` INT,
    `role_id` INT,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_by` INT,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT `fk_admin_ibfk_1` FOREIGN KEY (org_id) REFERENCES organisation (id) ON DELETE CASCADE,
    CONSTRAINT `fk_admin_ibfk_2` FOREIGN KEY (role_id) REFERENCES role (id) ON DELETE CASCADE
);

CREATE TABLE `service` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(255) UNIQUE NOT NULL,
    `created_by` INT DEFAULT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_by` INT DEFAULT NULL,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT `fk_service_ibfk_1` FOREIGN KEY (created_by) REFERENCES admin (id)
);

CREATE TABLE `service_organisation_rel` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(255) NOT NULL,
    `description` TEXT,
    `service_type` INT,
    `org_id` INT NOT NULL,
    `status` TINYINT DEFAULT 1,
    `created_by` INT,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT `fk_service_organisation_ibfk_1` FOREIGN KEY (service_type) REFERENCES service (id) ON DELETE CASCADE,
    CONSTRAINT `fk_service_organisation_ibfk_2` FOREIGN KEY (org_id) REFERENCES organisation (id) ON DELETE CASCADE,
    CONSTRAINT `fk_service_organisation_ibfk_3` FOREIGN KEY (created_by) REFERENCES admin (id)
);

CREATE TABLE `project` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `description` TEXT,
    `name` VARCHAR(255) NOT NULL,
    `city` VARCHAR(255),
    `district` VARCHAR(255),
    `state` VARCHAR(255),
    `country` VARCHAR(255),
    `org_id` INT,
    `floors` INT,
    `gmap_link` TEXT,
    `created_by` INT,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_by` INT,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT `fk_project_ibfk_1` FOREIGN KEY (org_id) REFERENCES organisation (id) ON DELETE CASCADE,
    CONSTRAINT `fk_project_ibfk_2` FOREIGN KEY (created_by) REFERENCES admin (id),
    CONSTRAINT `fk_project_ibfk_3` FOREIGN KEY (updated_by) REFERENCES admin (id)
);

CREATE TABLE `project_service_rel` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `project_id` INT,
    `service_id` INT,
    `meta_data` TEXT,
    `status` TINYINT DEFAULT 1,
    `created_by` INT,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT `fk_project_service_rel_ibfk_1` FOREIGN KEY (project_id) REFERENCES project (id) ON DELETE CASCADE,
    CONSTRAINT `fk_project_service_rel_ibfk_2` FOREIGN KEY (service_id) REFERENCES service_organisation_rel (id) ON DELETE CASCADE,
    CONSTRAINT `fk_project_service_rel_ibfk_3` FOREIGN KEY (created_by) REFERENCES admin (id)
);
CREATE TABLE `resident_identity` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `ph_num` VARCHAR(255) UNIQUE NOT NULL,  -- Phone number stays unique here
    `email_id` VARCHAR(255),
    `fcm_token` TEXT,
    `created_by` INT,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_by` INT,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT `fk_resident_identity_ibfk_1` FOREIGN KEY (created_by) REFERENCES admin (id)
);

CREATE TABLE `resident` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `identity_id` INT,
    `firstname` VARCHAR(255) NOT NULL,
    `lastname` VARCHAR(255) NOT NULL,
    `org_id` INT,
    `status` TINYINT DEFAULT 1,
    `email_id` VARCHAR(255),
    `fcm_token` TEXT,
    `created_by` INT,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_by` INT,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT `fk_resident_ibfk_1` FOREIGN KEY (created_by) REFERENCES admin (id),
    CONSTRAINT `fk_resident_ibfk_2` FOREIGN KEY (updated_by) REFERENCES admin (id),
    CONSTRAINT `fk_resident_ibfk_3` FOREIGN KEY (identity_id) REFERENCES resident_identity (id),
    CONSTRAINT `fk_resident_ibfk_4` FOREIGN KEY (org_id) REFERENCES organisation (id)
);

CREATE TABLE `apartment` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(255),
    `status` TINYINT DEFAULT 1,
    `floor` INT,
    `project_id` INT,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `created_by` INT,
    `updated_by` INT,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT `fk_apartment_ibfk_1` FOREIGN KEY (project_id) REFERENCES project (id) ON DELETE CASCADE,
    CONSTRAINT `fk_apartment_ibfk_2` FOREIGN KEY (created_by) REFERENCES admin (id),
    CONSTRAINT `fk_apartment_ibfk_3` FOREIGN KEY (updated_by) REFERENCES admin (id)
);

CREATE TABLE `apartment_resident_rel` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `apartment_id` INT,
    `resident_id` INT,
    `status` TINYINT DEFAULT 1,
    `type` TINYINT DEFAULT NULL,
    `created_by` INT,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_by` INT,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT `fk_apartment_resident_rel_ibfk_1` FOREIGN KEY (apartment_id) REFERENCES apartment (id) ON DELETE CASCADE,
    CONSTRAINT `fk_apartment_resident_rel_ibfk_2` FOREIGN KEY (resident_id) REFERENCES resident (id) ON DELETE CASCADE,
    CONSTRAINT `fk_apartment_resident_rel_ibfk_3` FOREIGN KEY (created_by) REFERENCES admin (id),
    CONSTRAINT `fk_apartment_resident_rel_ibfk_4` FOREIGN KEY (updated_by) REFERENCES admin (id)
);

CREATE TABLE `admin_service_rel` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `admin_id` INT,
    `service_id` INT,
    `status` TINYINT DEFAULT 1,
    `created_by` INT,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_by` INT,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT `fk_admin_service_rel_ibfk_1` FOREIGN KEY (admin_id) REFERENCES admin (id) ON DELETE CASCADE,
    CONSTRAINT `fk_admin_service_rel_ibfk_2` FOREIGN KEY (service_id) REFERENCES service (id) ON DELETE CASCADE,
    CONSTRAINT `fk_admin_service_rel_ibfk_3` FOREIGN KEY (created_by) REFERENCES admin (id),
    CONSTRAINT `fk_admin_service_rel_ibfk_4` FOREIGN KEY (updated_by) REFERENCES admin (id)
);
CREATE TABLE `agent_identity` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `ph_num` VARCHAR(255) UNIQUE NOT NULL,  -- Phone number stays unique here
    `email_id` VARCHAR(255),
    `fcm_token` TEXT,
    `created_by` INT,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_by` INT,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT `fk_agent_identity_ibfk_1` FOREIGN KEY (created_by) REFERENCES admin (id)
);
CREATE TABLE `agent` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `identity_id` INT NOT NULL,
    `firstname` VARCHAR(255) NOT NULL,
    `lastname` VARCHAR(255) NOT NULL,
    `org_id` INT,
    `status` TINYINT DEFAULT 1,
    `city` VARCHAR(255),
    `district` VARCHAR(255),
    `state` VARCHAR(255),
    `country` VARCHAR(255),
    `email_id` VARCHAR(255),
    `proficient_service` JSON,
    `location` VARCHAR(255),
    `created_by` INT,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_by` INT,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT `fk_agent_ibfk_1` FOREIGN KEY (created_by) REFERENCES admin (id),
    CONSTRAINT `fk_agent_ibfk_2` FOREIGN KEY (updated_by) REFERENCES admin (id),
    CONSTRAINT `fk_agent_ibfk_3` FOREIGN KEY (identity_id) REFERENCES agent_identity (id),
    CONSTRAINT `fk_agent_ibfk_4` FOREIGN KEY (org_id) REFERENCES organisation (id)
);

CREATE TABLE `agent_service_rel` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `agent_id` INT,
    `service_id` INT,
    `status` TINYINT DEFAULT 1,
    `created_by` INT,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_by` INT,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT `fk_agent_service_rel_ibfk_1` FOREIGN KEY (agent_id) REFERENCES agent (id) ON DELETE CASCADE,
    CONSTRAINT `fk_agent_service_rel_ibfk_2` FOREIGN KEY (service_id) REFERENCES service (id) ON DELETE CASCADE,
    CONSTRAINT `fk_agent_service_rel_ibfk_3` FOREIGN KEY (created_by) REFERENCES admin (id),
    CONSTRAINT `fk_agent_service_rel_ibfk_4` FOREIGN KEY (updated_by) REFERENCES admin (id)
);

CREATE TABLE `payment` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `order_id` VARCHAR(255) UNIQUE NOT NULL,
    `amount` INT NOT NULL,
    `status` VARCHAR(50) NOT NULL,
    `payment_method` VARCHAR(50) NOT NULL,
    `created_by` INT,
    `updated_by` INT,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    KEY `status` (`status`)
);

CREATE TABLE `issue` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `org_id` INT,
    `apartment_id` INT,
    `resident_id` INT,
    `status` TINYINT DEFAULT 0,
    `sub_status` INT DEFAULT NULL,
    `description` TEXT,
    `agent_id` INT,
    `creator_id` INT,
    `creator_type` TINYINT,
    `service_type` INT,
    `service_subtype` INT,
    `issue_type` VARCHAR(255),
    `initial_activity_time` DATETIME,
    `customer_preferred_time` DATETIME,
    `due_date` DATETIME,
    `rating` INT,
    `payment_id` INT,
    `img_src` TEXT,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_by` INT,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    KEY `status` (`status`),
    CONSTRAINT `fk_issue_ibfk_1` FOREIGN KEY (apartment_id) REFERENCES apartment (id) ON DELETE CASCADE,
    CONSTRAINT `fk_issue_ibfk_2` FOREIGN KEY (resident_id) REFERENCES resident (id) ON DELETE CASCADE,
    CONSTRAINT `fk_issue_ibfk_3` FOREIGN KEY (agent_id) REFERENCES agent (id) ON DELETE CASCADE,
    CONSTRAINT `fk_issue_ibfk_4` FOREIGN KEY (payment_id) REFERENCES payment (id) ON DELETE SET NULL,
    CONSTRAINT `fk_issue_ibfk_5` FOREIGN KEY (org_id) REFERENCES organisation (id) ON DELETE CASCADE,
    CONSTRAINT `fk_issue_ibfk_6` FOREIGN KEY (service_type) REFERENCES service (id) ON DELETE SET NULL,
    CONSTRAINT `fk_issue_ibfk_7` FOREIGN KEY (service_subtype) REFERENCES service_organisation_rel (id) ON DELETE SET NULL
);

CREATE TABLE `escalation` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `issue_id` INT,
    `escalated_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `reason` TEXT,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT `fk_escalation_ibfk_1` FOREIGN KEY (issue_id) REFERENCES issue (id) ON DELETE CASCADE
);

CREATE TABLE `issue_event` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `issue_id` INT,
    `event_type` VARCHAR(50) NOT NULL,
    `sub_status` TINYINT DEFAULT NULL,
    `entity_id` INT DEFAULT NULL, -- Can be agent_assignment_id, estimate_id wrt to the substatus added
    `event_time` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `description` TEXT,
    `creator_id` INT,
    `creator_type` TINYINT,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    KEY `sub_status` (`sub_status`),
    CONSTRAINT `fk_issue_event_ibfk_1` FOREIGN KEY (issue_id) REFERENCES issue (id) ON DELETE CASCADE
);

CREATE TABLE `agent_assignment` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `issue_id` INT,
    `agent_id` INT,
    `status` TINYINT DEFAULT 0, -- 0 = pending, 1 = completed
    `notes` TEXT,
    `assigned_by` INT,
    `assigned_time` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `visit_scheduled_time` DATETIME,
    `otp_sent_time` DATETIME,
    `otp_code` VARCHAR(10),
    `agent_inferences` TEXT,
    `agent_uploads` TEXT,
    `created_by` INT DEFAULT NULL,
    `updated_by` INT DEFAULT NULL,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT `fk_agent_assignment_ibfk_1` FOREIGN KEY (issue_id) REFERENCES issue (id) ON DELETE CASCADE,
    CONSTRAINT `fk_agent_assignment_ibfk_2` FOREIGN KEY (agent_id) REFERENCES agent (id) ON DELETE CASCADE,
    CONSTRAINT `fk_agent_assignment_ibfk_3` FOREIGN KEY (created_by) REFERENCES admin (id) ON DELETE CASCADE,
    CONSTRAINT `fk_agent_assignment_ibfk_4` FOREIGN KEY (updated_by) REFERENCES admin (id) ON DELETE CASCADE
);
CREATE TABLE `estimate` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `issue_id` INT NOT NULL,
    `material_charge` INT,
    `labour_charge` INT DEFAULT 0,
    `status` TINYINT DEFAULT 0,
    `expiry_date` DATETIME,
    `other_charge` INT DEFAULT 0,
    `total_charge` INT NOT NULL,
    `is_18_percent_gst_applied` TINYINT DEFAULT 0,
    `is_inclusive_tax` TINYINT DEFAULT 0,
    `is_exclusive_tax` TINYINT DEFAULT 0,
    `estimate_created_time` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `notes` TEXT,
    `src` TEXT,
    `filename` TEXT DEFAULT NULL,
    `created_by` INT DEFAULT NULL,
    `approved_rejected_by` INT DEFAULT NULL,
    `approved_rejected_by_type` TINYINT DEFAULT 0,
    `updated_by` INT DEFAULT NULL,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT `fk_estimate_ibfk_1` FOREIGN KEY (issue_id) REFERENCES issue (id) ON DELETE CASCADE,
    CONSTRAINT `fk_estimate_ibfk_2` FOREIGN KEY (created_by) REFERENCES admin (id) ON DELETE CASCADE,
    CONSTRAINT `fk_estimate_ibfk_3` FOREIGN KEY (updated_by) REFERENCES admin (id) ON DELETE CASCADE
);
CREATE TABLE `invoice` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `issue_id` INT NOT NULL,
    `material_charge` INT,
    `labour_charge` INT DEFAULT 0,
    `status` TINYINT DEFAULT 0,
    `expiry_date` DATETIME,
    `other_charge` INT DEFAULT 0,
    `total_charge` INT NOT NULL,
    `collected_by` VARCHAR(255),
    `payment_mode` TINYINT DEFAULT NULL,
    `is_18_percent_gst_applied` TINYINT DEFAULT 0,
    `is_inclusive_tax` TINYINT DEFAULT 0,
    `is_exclusive_tax` TINYINT DEFAULT 0,
    `estimate_created_time` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `notes` TEXT,
    `src` TEXT,
    `filename` TEXT DEFAULT NULL,
    `approved_rejected_by` INT DEFAULT NULL,
    `approved_rejected_by_type` TINYINT DEFAULT 0,
    `created_by` INT DEFAULT NULL,
    `updated_by` INT DEFAULT NULL,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT `fk_invoice_ibfk_1` FOREIGN KEY (issue_id) REFERENCES issue (id) ON DELETE CASCADE,
    CONSTRAINT `fk_invoice_ibfk_2` FOREIGN KEY (created_by) REFERENCES admin (id) ON DELETE CASCADE,
    CONSTRAINT `fk_invoice_ibfk_3` FOREIGN KEY (updated_by) REFERENCES admin (id) ON DELETE CASCADE
);

CREATE TABLE `announcement` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `title` VARCHAR(255),
    `org_id` INT,
    `project_id` JSON,
    `description` TEXT,
    `status` TINYINT DEFAULT 1,
    `img_src` VARCHAR(255),
    `filename` TEXT DEFAULT NULL,
    `expire_date` DATETIME,
    `created_by` INT,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT `fk_announcement_ibfk_1` FOREIGN KEY (org_id) REFERENCES organisation (id) ON DELETE CASCADE
);
CREATE TABLE `announcement_interest` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `announcement_id` INT,
    `resident_id` INT,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT `fk_announcement_interest_ibfk_1` FOREIGN KEY (announcement_id) REFERENCES announcement (id) ON DELETE CASCADE,
    CONSTRAINT `fk_announcement_interest_ibfk_2` FOREIGN KEY (resident_id) REFERENCES resident (id) ON DELETE CASCADE
);
CREATE TABLE `notification` (
    `id` SERIAL PRIMARY KEY,
    `user_id` INT NOT NULL,
    `user_type` TINYINT NOT NULL,
    `message` TEXT NOT NULL,
    `status` TINYINT DEFAULT 0,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
CREATE TABLE `report` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `org_id` INT NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `type` INT NOT NULL,
    `status` TINYINT DEFAULT 0,
    `start_date` TIMESTAMP,
    `end_date` TIMESTAMP,
    `filename` VARCHAR(255),
    `download_path` TEXT,
    `config` JSON,
    `created_by` INT,
    `updated_by` INT,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT `fk_report_ibfk_1` FOREIGN KEY (created_by) REFERENCES admin (id) ON DELETE CASCADE,
    CONSTRAINT `fk_report_ibfk_2` FOREIGN KEY (updated_by) REFERENCES admin (id) ON DELETE CASCADE,
    CONSTRAINT `fk_report_ibfk_3` FOREIGN KEY (org_id) REFERENCES organisation (id) ON DELETE CASCADE
);
CREATE TABLE `subscriptions` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `org_id` INT NOT NULL,
    `razorpay_subscription_id` VARCHAR(255) NOT NULL,
    `status` TINYINT DEFAULT 0,
    `start_date` DATETIME NOT NULL,
    `next_billing_date` DATETIME NOT NULL,
    FOREIGN KEY (`org_id`) REFERENCES `organisation`(`id`) ON DELETE CASCADE
);
CREATE TABLE `subscription_payment_log` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `subscription_id` INT NOT NULL,
    `transaction_id` VARCHAR(255) NOT NULL,
    `amount` DECIMAL(10, 2) NOT NULL,
    `payment_date` DATETIME NOT NULL,
    `status` TINYINT DEFAULT 0,
    `failure_reason` TEXT DEFAULT NULL,
    FOREIGN KEY (`subscription_id`) REFERENCES `subscriptions`(`id`) ON DELETE CASCADE
);

INSERT INTO `service` SET name='plumbing';
INSERT INTO `service` SET name='electrical';
INSERT INTO `service` SET name='cleaning';
INSERT INTO `service` SET name='designing';
INSERT INTO `service` SET name='others';