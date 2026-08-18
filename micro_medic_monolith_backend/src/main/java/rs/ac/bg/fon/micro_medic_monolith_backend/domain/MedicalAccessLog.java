package rs.ac.bg.fon.micro_medic_monolith_backend.domain;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "medical_access_log")

@Data
@NoArgsConstructor(access = lombok.AccessLevel.PROTECTED)
@AllArgsConstructor(access = lombok.AccessLevel.PACKAGE)
@Builder
public class MedicalAccessLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long accessorId;

    @Column(length = 64)
    private String accessorRole;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private AccessedResourceType resourceType;

    @Column(nullable = false)
    private Long resourceId;

    private Long patientId;

    @Column(nullable = false)
    private LocalDateTime accessedAt;

    public enum AccessedResourceType {
        PATIENT,
        EXAMINATION,
        REPORT,
        DOCTOR,
        APPOINTMENT
    }
}
