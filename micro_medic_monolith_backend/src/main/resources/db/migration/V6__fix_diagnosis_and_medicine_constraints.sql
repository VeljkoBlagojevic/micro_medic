-- A diagnosis is many-to-one: any number of examinations may carry the same ICD-10 code.
-- V1 declared examination.diagnosis UNIQUE, which capped each code at one examination
-- system-wide, so the second patient diagnosed with anything failed with a 409.
-- The FK is dropped first because it depends on the unique index, and the replacement
-- index is created before the FK is re-added so MySQL does not auto-create its own.

ALTER TABLE examination DROP FOREIGN KEY fk_examination_diagnosis;
DROP INDEX diagnosis ON examination;

CREATE INDEX idx_examination_diagnosis ON examination (diagnosis);
ALTER TABLE examination
ADD CONSTRAINT fk_examination_diagnosis FOREIGN KEY (diagnosis) REFERENCES disease(code) ON DELETE SET NULL;

-- medicines.json legitimately repeats generic names (same drug, different brand) and has 380 entries with no brand name, so neither column can be UNIQUE, and brand_name cannot
-- be NOT NULL. Plain indexes replace the unique ones to keep lookups and search fast.

ALTER TABLE medicine DROP INDEX generic_name;
ALTER TABLE medicine DROP INDEX brand_name;
ALTER TABLE medicine MODIFY generic_name VARCHAR(255) NOT NULL;
ALTER TABLE medicine MODIFY brand_name VARCHAR(255) NULL;

CREATE INDEX idx_medicine_generic_name ON medicine (generic_name);
CREATE INDEX idx_medicine_brand_name ON medicine (brand_name);
