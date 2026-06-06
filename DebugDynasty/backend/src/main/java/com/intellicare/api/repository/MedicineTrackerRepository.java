package com.intellicare.api.repository;

import com.intellicare.api.model.MedicineTracker;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface MedicineTrackerRepository extends JpaRepository<MedicineTracker, Long> {
    List<MedicineTracker> findByPatientUidOrderByIdDesc(String patientUid);
}
