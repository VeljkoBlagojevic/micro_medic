
CREATE INDEX idx_appt_doctor_start ON scheduled_appointment (doctor_id, start);
CREATE INDEX idx_appt_patient_start ON scheduled_appointment (patient_id, start);