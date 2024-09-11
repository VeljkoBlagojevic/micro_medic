package rs.ac.bg.fon.micro_medic_monolith_backend.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import rs.ac.bg.fon.micro_medic_monolith_backend.domain.ScheduledAppointment;
import rs.ac.bg.fon.micro_medic_monolith_backend.domain.SpecializationDepartment;
import rs.ac.bg.fon.micro_medic_monolith_backend.repository.SpecializationDepartmentRepository;

import java.io.InputStream;
import java.util.List;
import java.util.NoSuchElementException;

@RequiredArgsConstructor
@Service
public class SpecializationDepartmentsService {

    private final SpecializationDepartmentRepository specializationDepartmentRepository;

    public void populateDepartments() throws Exception {
        ObjectMapper objectMapper = new ObjectMapper();
        InputStream inputStream = TypeReference.class.getResourceAsStream("/specialization_departments.json");

        List<SpecializationDepartment> departments = objectMapper.readValue(inputStream, new TypeReference<List<SpecializationDepartment>>() {});

        specializationDepartmentRepository.saveAll(departments);
    }

    public List<SpecializationDepartment> getAll() {
        return specializationDepartmentRepository.findAll();
    }

    public SpecializationDepartment getById(Long id) {
        return specializationDepartmentRepository.findById(id).orElseThrow(() ->
                new NoSuchElementException("Specialization department with id: " + id + " not found"));
    }

}
