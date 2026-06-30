package rs.ac.bg.fon.micro_medic_monolith_backend.dto;

public record DoctorDto(
        Long id,
        String firstname,
        String lastname,
        String email,
        String username,
        SpecializationDepartmentDto specialization
) {
}
