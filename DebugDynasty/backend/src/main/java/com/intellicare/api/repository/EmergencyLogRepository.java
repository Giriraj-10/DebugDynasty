package com.intellicare.api.repository;

import com.intellicare.api.model.EmergencyLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface EmergencyLogRepository extends JpaRepository<EmergencyLog, Long> {

    List<EmergencyLog> findByPatientUid(String patientUid);

    Optional<EmergencyLog> findFirstByPatientUidAndStatusOrderByIdDesc(String patientUid, String status);
    Optional<EmergencyLog> findFirstByPatientUidAndStatusInOrderByIdDesc(String patientUid, java.util.Collection<String> statuses);

    Optional<EmergencyLog> findFirstByAmbulanceUidAndStatusOrderByIdDesc(String ambulanceUid, String status);
    Optional<EmergencyLog> findFirstByAmbulanceUidAndStatusInOrderByIdDesc(String ambulanceUid, java.util.Collection<String> statuses);

    List<EmergencyLog> findByHospitalUidAndStatus(String hospitalUid, String status);
    
    List<EmergencyLog> findByHospitalUid(String hospitalUid);

    List<EmergencyLog> findByHospitalUidOrderByIdDesc(String hospitalUid);
}
