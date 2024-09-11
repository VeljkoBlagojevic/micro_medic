package rs.ac.bg.fon.micro_medic_monolith_backend.domain;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;
import rs.ac.bg.fon.micro_medic_monolith_backend.repository.MedicineFormConverter;


@Entity

@JsonIgnoreProperties(ignoreUnknown = true)
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Getter
@Setter
@EqualsAndHashCode
@ToString
public class Medicine {

    @Id
    @JsonProperty("id")
    @Column(name = "id")
    private Long id;

    @NotBlank(message = "Medicine name can't be blank")
    @JsonProperty("genericName")
    @Column(name = "generic_name")
    private String genericName;

    @JsonProperty("brandName")
    @Column(name = "brand_name")
    private String brandName;

    @Convert(converter = MedicineFormConverter.class)
    private MedicineForm form;
}
