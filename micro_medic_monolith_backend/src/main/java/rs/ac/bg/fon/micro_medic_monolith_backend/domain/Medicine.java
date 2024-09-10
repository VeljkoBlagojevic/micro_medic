package rs.ac.bg.fon.micro_medic_monolith_backend.domain;

import jakarta.persistence.*;
import lombok.*;
import rs.ac.bg.fon.micro_medic_monolith_backend.repository.MedicineFormConverter;


@Entity

@NoArgsConstructor
@AllArgsConstructor
@Builder
@Getter
@Setter
@EqualsAndHashCode
@ToString
public class Medicine {

    @Id
    private Long id;

    private String genericName;

    //moze u drugu klasu
    private String brandName;

    @Convert(converter = MedicineFormConverter.class)
    private MedicineForm form;
}
