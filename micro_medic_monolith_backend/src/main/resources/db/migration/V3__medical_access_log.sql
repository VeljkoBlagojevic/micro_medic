CREATE TABLE IF NOT EXISTS medical_access_log (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    accessor_id     BIGINT NOT NULL,
    accessor_role   VARCHAR(64) DEFAULT NULL,
    resource_type   VARCHAR(32) NOT NULL,
    resource_id     BIGINT NOT NULL,
    patient_id      BIGINT DEFAULT NULL,
    accessed_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_medical_access_log_accessor FOREIGN KEY (accessor_id) REFERENCES user(id),
    CONSTRAINT fk_medical_access_log_patient FOREIGN KEY (patient_id) REFERENCES patient(id)
) ENGINE=InnoDB;

CREATE INDEX idx_medical_access_log_accessor ON medical_access_log (accessor_id);
CREATE INDEX idx_medical_access_log_patient ON medical_access_log (patient_id);