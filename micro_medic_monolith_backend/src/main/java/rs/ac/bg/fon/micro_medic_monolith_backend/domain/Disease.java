package rs.ac.bg.fon.micro_medic_monolith_backend.domain;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import lombok.Data;

@Entity

@Data
public class Disease {

    @Id
    private String code;

    @JsonProperty("desc")
    private String description;
}
