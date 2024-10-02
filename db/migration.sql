CREATE TABLE `organisation` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(255) NOT NULL,
    `domain` VARCHAR(255) UNIQUE NOT NULL,
    `config` JSON,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_by` INT,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    KEY `domain` (`domain`)
);

CREATE TABLE `services` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(255) UNIQUE NOT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_by` INT,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE `service_organisation` (
    `services_id` INT,
    `org_id` INT,
    `status` TINYINT DEFAULT 1,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `fk_service_organisation_ibfk_1` FOREIGN KEY (services_id) REFERENCES services(id) ON DELETE CASCADE,
    CONSTRAINT `fk_service_organisation_ibfk_2` FOREIGN KEY (org_id) REFERENCES organisation(id) ON DELETE CASCADE
);

CREATE TABLE `project` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(255) NOT NULL,
    `district` VARCHAR(255),
    `state` VARCHAR(255),
    `country` VARCHAR(255),
    `org_id` INT,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_by` INT,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT `fk_project_ibfk_1` FOREIGN KEY (org_id) REFERENCES organisation(id) ON DELETE CASCADE
);

CREATE TABLE `project_service_rel` (
    `project_id` INT,
    `service_id` INT,   
    `meta_data` TEXT,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `fk_project_service_rel_ibfk_1` FOREIGN KEY (project_id) REFERENCES project(id) ON DELETE CASCADE,
    CONSTRAINT `fk_project_service_rel_ibfk_2` FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE
);

CREATE TABLE `resident` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(255) NOT NULL,
    `org_id` INT,
    `project_id` INT,
    `ph_num` INT UNIQUE NOT NULL,
    `email_id` VARCHAR(255),
    `fcm_token` TEXT,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_by` INT,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    KEY `ph_num` (`ph_num`),
    CONSTRAINT `fk_resident_ibfk_1` FOREIGN KEY (`org_id`) REFERENCES organisation(id) ON DELETE CASCADE,
    CONSTRAINT `fk_resident_ibfk_2` FOREIGN KEY (`project_id`) REFERENCES project(id) ON DELETE CASCADE
);

CREATE TABLE `apartment` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(255) NOT NULL,
    `floor` INT,
    `project_id` INT,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_by` INT,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT `fk_apartment_ibfk_1` FOREIGN KEY (project_id) REFERENCES project(id) ON DELETE CASCADE
);

CREATE TABLE `apartment_resident_rel` (
    `apartment_id` INT,
    `resident_id` INT,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `fk_apartment_resident_rel_ibfk_1` FOREIGN KEY (apartment_id) REFERENCES apartment(id) ON DELETE CASCADE,
    CONSTRAINT `fk_apartment_resident_rel_ibfk_2` FOREIGN KEY (resident_id) REFERENCES resident(id) ON DELETE CASCADE
);

CREATE TABLE `manager` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(255) NOT NULL,
    `username` VARCHAR(255) UNIQUE NOT NULL,
    `password` VARCHAR(255) NOT NULL,
    `org_id` INT,
    `project_id` INT,
    `status` TINYINT DEFAULT 1,
    `reports_to` INT,
    `role_id` INT,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_by` INT,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    KEY `username` (`username`),
    CONSTRAINT `fk_manager_ibfk_1` FOREIGN KEY (org_id) REFERENCES organisation(id) ON DELETE CASCADE,
    CONSTRAINT `fk_manager_ibfk_2` FOREIGN KEY (project_id) REFERENCES project(id) ON DELETE CASCADE,
    CONSTRAINT `fk_manager_ibfk_3` FOREIGN KEY (role_id) REFERENCES role(id) ON DELETE CASCADE
);

CREATE TABLE `manager_service_rel` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `manager_id` INT,
    `service_id` INT,
    `status` TINYINT DEFAULT 1,
    CONSTRAINT `fk_manager_service_rel_ibfk_1` FOREIGN KEY (manager_id) REFERENCES manager(id) ON DELETE CASCADE,
    CONSTRAINT `fk_manager_service_rel_ibfk_2` FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE
);

CREATE TABLE `agent` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(255) NOT NULL,
    `ph_num` VARCHAR(255) UNIQUE NOT NULL,
    `status` TINYINT DEFAULT 1,
    `proficient_service` JSON,
    `location` VARCHAR(255),
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_by` INT,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    KEY `ph_num` (`ph_num`),
);

CREATE TABLE `agent_service_rel` (
    `agent_id` INT,
    `service_id` INT,
    `status` TINYINT DEFAULT 1,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `fk_agent_service_rel_ibfk_1` FOREIGN KEY (agent_id) REFERENCES agent(id) ON DELETE CASCADE,
    CONSTRAINT `fk_agent_service_rel_ibfk_2` FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE
);

CREATE TABLE `agent_organisation_rel` (
    `agent_id` INT,
    `organisation_id` INT,
    `status` TINYINT DEFAULT 1,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `fk_agent_organisation_rel_ibfk_1` FOREIGN KEY (agent_id) REFERENCES agent(id) ON DELETE CASCADE,
    CONSTRAINT `fk_agent_organisation_rel_ibfk_2` FOREIGN KEY (organisation_id) REFERENCES organisation(id) ON DELETE CASCADE
);

CREATE TABLE `role` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(255) NOT NULL,
    `org_id` INT,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_by` INT,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT `fk_role_ibfk_1` FOREIGN KEY (org_id) REFERENCES organisation(id) ON DELETE CASCADE
);

CREATE TABLE `permission` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(255) NOT NULL,
    `code` VARCHAR(255) NOT NULL,
    `org_id` INT,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_by` INT,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT `fk_permission_ibfk_1` FOREIGN KEY (org_id) REFERENCES organisation(id) ON DELETE CASCADE
);

CREATE TABLE `role_permission` (
    `role_id` INT,
    `permission_id` INT,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `fk_role_permission_ibfk_1` FOREIGN KEY (role_id) REFERENCES role(id) ON DELETE CASCADE,
    CONSTRAINT `fk_role_permission_ibfk_2` FOREIGN KEY (permission_id) REFERENCES permission(id) ON DELETE CASCADE
);

CREATE TABLE `payment` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `order_id` VARCHAR(255) UNIQUE NOT NULL,
    `amount` INT NOT NULL,
    `status` VARCHAR(50) NOT NULL,
    `payment_method` VARCHAR(50) NOT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `updated_by` INT,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    KEY `order_id` (`order_id`),
    KEY `status` (`status`)
);

CREATE TABLE `issue` (
    `apartment_id` INT,
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `resident_id` INT,
    `agent_id` INT,
    `creator_id` INT,
    `creator_type` TINYINT,
    `issue_type` VARCHAR(255),
    `status` TINYINT DEFAULT 1,
    `due_date` DATETIME,
    `rating` INT,
    `created_by` INT,
    `payment_id` INT,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_by` INT,
    KEY `status` (`status`),
    CONSTRAINT `fk_issue_ibfk_1` FOREIGN KEY (apartment_id) REFERENCES apartment(id) ON DELETE CASCADE,
    CONSTRAINT `fk_issue_ibfk_2` FOREIGN KEY (resident_id) REFERENCES resident(id) ON DELETE CASCADE,
    CONSTRAINT `fk_issue_ibfk_3` FOREIGN KEY (agent_id) REFERENCES agent(id) ON DELETE CASCADE,
    CONSTRAINT `fk_issue_ibfk_4` FOREIGN KEY (payment_id) REFERENCES payment(id) ON DELETE SET NULL
);

CREATE TABLE `escalation` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `issue_id` INT,
    `escalated_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `reason` TEXT,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `fk_escalation_ibfk_1` FOREIGN KEY (issue_id) REFERENCES issue(id) ON DELETE CASCADE
);

CREATE TABLE `issue_event` {
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `issue_id` INT,
    `event_type` VARCHAR(50) NOT NULL,
    `status` TINYINT DEFAULT 1,
    `event_time` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `description` TEXT,
    `creator_id` INT,
    `creator_type` TINYINT,
    KEY `status` (`status`),
    CONSTRAINT `fk_issue_event_ibfk_1` FOREIGN KEY (issue_id) REFERENCES issue(id) ON DELETE CASCADE
};

CREATE TABLE `agent_assignment` {
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `issue_id` INT,
    `agent_id` INT,
    `job_type` VARCHAR(255),
    `assigned_by` INT,
    `assigned_time` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `visit_scheduled_time` DATETIME,
    `otp_sent_time` DATETIME,
    `otp_code` VARCHAR(10),
    KEY `job_type` (`job_type`)
    CONSTRAINT `fk_agent_assignment_ibfk_1` FOREIGN KEY (issue_id) REFERENCES issue(id) ON DELETE CASCADE,
    CONSTRAINT `fk_agent_assignment_ibfk_2` FOREIGN KEY (agent_id) REFERENCES agent(id) ON DELETE CASCADE
};

CREATE TABLE `estimate` {
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `issue_id` INT,
    `agent_id` INT,
    `estimated_amount` INT,
    `estimate_created_time` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `customer_decision` TINYINT DEFAULT 0,
    `decision_time` DATETIME,
    `labour_charge` INT DEFAULT 0,
    `material_charge` INT DEFAULT 0,
    `other_charge` INT DEFAULT 0,
    CONSTRAINT `fk_estimate_ibfk_1` FOREIGN KEY (issue_id) REFERENCES issue(id) ON DELETE CASCADE,
    CONSTRAINT `fk_estimate_ibfk_2` FOREIGN KEY (agent_id) REFERENCES agent(id) ON DELETE CASCADE
};