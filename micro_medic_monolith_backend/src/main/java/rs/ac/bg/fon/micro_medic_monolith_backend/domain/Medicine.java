package rs.ac.bg.fon.micro_medic_monolith_backend.domain;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.Column;
import jakarta.persistence.Convert;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import org.hibernate.validator.constraints.br.CPF;
import rs.ac.bg.fon.micro_medic_monolith_backend.repository.MedicineFormConverter;

@Entity

@JsonIgnoreProperties(ignoreUnknown = true)

@Data
public class Medicine {

    @Id
    @Column(name = "id")
    @JsonProperty("id")
    private Long id;

    @NotBlank
    @Column(name = "generic_name")
    @JsonProperty("genericName")
    private String genericName;

    @Column(name = "brand_name")
    @JsonProperty("brandName")
    private String brandName;

    @Convert(converter = MedicineFormConverter.class)
    private MedicineForm form;
}
