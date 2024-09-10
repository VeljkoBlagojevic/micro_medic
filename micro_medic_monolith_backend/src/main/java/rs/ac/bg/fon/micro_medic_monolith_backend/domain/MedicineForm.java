package rs.ac.bg.fon.micro_medic_monolith_backend.domain;

public enum MedicineForm {

    //proveri typo i da li ima jos komada
    TABLET("Tablet"),
    INJECTIBLE("Injectible"),
    SUPPOSITORY("Suppository"),
    SOLUTION("Solution"),
    APPLICATION("Application"),
    EYE_OINTMENT("Eye Ointment");

    private String name;

    MedicineForm(String name) {
        this.name = name;
    }

    public String getName() {
        return name;
    }
}
