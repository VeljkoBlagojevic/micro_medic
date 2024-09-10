package rs.ac.bg.fon.micro_medic_monolith_backend.domain;

import jakarta.persistence.*;
import lombok.*;

@Entity

@NoArgsConstructor
@AllArgsConstructor
@Builder
@Getter
@Setter
@EqualsAndHashCode
@ToString
public class Disease {

    @Id
    //ili ovo da bude NaturalId a drugi Id da bude auto generisan
    private String code;

    private String description;
}
