CREATE TABLE IF NOT EXISTS specialization_department (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS user (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    dtype VARCHAR(31) NOT NULL,
    firstname VARCHAR(255) NOT NULL,
    lastname VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    username VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS doctor (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    specialization_id BIGINT NOT NULL,
    CONSTRAINT fk_doctor_specialization FOREIGN KEY (specialization_id) REFERENCES specialization_department(id) ON DELETE CASCADE,
    CONSTRAINT fk_doctor_user FOREIGN KEY (id) REFERENCES user(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS patient (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    CONSTRAINT fk_patient_user FOREIGN KEY (id) REFERENCES user(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS disease (
    code VARCHAR(255) PRIMARY KEY,
    description VARCHAR(255) NOT NULL UNIQUE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS medicine (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    generic_name VARCHAR(255) NOT NULL UNIQUE,
    brand_name VARCHAR(255) NOT NULL UNIQUE,
    form VARCHAR(255)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS scheduled_appointment (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    start DATETIME NOT NULL,
    end DATETIME NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'SCHEDULED',
    doctor_id BIGINT NOT NULL,
    patient_id BIGINT NOT NULL,
    created_at DATETIME DEFAULT NULL,
    updated_at DATETIME DEFAULT NULL,
    created_by VARCHAR(255) DEFAULT NULL,
    last_modified_by VARCHAR(255) DEFAULT NULL,
    deleted BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT fk_appointment_doctor FOREIGN KEY (doctor_id) REFERENCES doctor(id) ON DELETE CASCADE,
    CONSTRAINT fk_appointment_patient FOREIGN KEY (patient_id) REFERENCES patient(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS examination (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    start DATETIME NOT NULL,
    end DATETIME NOT NULL,
    anamnesis TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'SCHEDULED',
    diagnosis VARCHAR(255) UNIQUE,
    scheduled_appointment_id BIGINT NOT NULL UNIQUE,
    created_at DATETIME DEFAULT NULL,
    updated_at DATETIME DEFAULT NULL,
    created_by VARCHAR(255) DEFAULT NULL,
    last_modified_by VARCHAR(255) DEFAULT NULL,
    deleted BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT fk_examination_appointment FOREIGN KEY (scheduled_appointment_id) REFERENCES scheduled_appointment(id) ON DELETE CASCADE,
    CONSTRAINT fk_examination_diagnosis FOREIGN KEY (diagnosis) REFERENCES disease(code) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS therapy (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    instructions TEXT NOT NULL,
    examination_id BIGINT NOT NULL UNIQUE,
    created_at DATETIME DEFAULT NULL,
    updated_at DATETIME DEFAULT NULL,
    created_by VARCHAR(255) DEFAULT NULL,
    last_modified_by VARCHAR(255) DEFAULT NULL,
    deleted BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT fk_therapy_examination FOREIGN KEY (examination_id) REFERENCES examination(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS medicine_usage (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    method_use VARCHAR(255) NOT NULL,
    frequency_intake_in_hours INT NOT NULL,
    medicine_id BIGINT NOT NULL,
    therapy_id BIGINT NOT NULL,
    CONSTRAINT fk_medicine_usage_medicine FOREIGN KEY (medicine_id) REFERENCES medicine(id) ON DELETE CASCADE,
    CONSTRAINT fk_medicine_usage_therapy FOREIGN KEY (therapy_id) REFERENCES therapy(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS report (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    creation_time DATETIME DEFAULT NULL,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    examination_id BIGINT NOT NULL UNIQUE,
    generated_by BIGINT NOT NULL,
    created_at DATETIME DEFAULT NULL,
    updated_at DATETIME DEFAULT NULL,
    created_by VARCHAR(255) DEFAULT NULL,
    last_modified_by VARCHAR(255) DEFAULT NULL,
    deleted BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT fk_report_examination FOREIGN KEY (examination_id) REFERENCES examination(id) ON DELETE CASCADE,
    CONSTRAINT fk_report_generated_by FOREIGN KEY (generated_by) REFERENCES user(id)
) ENGINE=InnoDB;
