package com.intellicare.api.repository;

import com.intellicare.api.model.Prescription;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface PrescriptionRepository extends JpaRepository<Prescription, Long> {
    List<Prescription> findByPatientUidOrderByIdDesc(String patientUid);
    List<Prescription> findByDoctorUidOrderByIdDesc(String doctorUid);
}
