package com.intellicare.api.repository;

import com.intellicare.api.model.ConsultationRoom;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ConsultationRoomRepository extends JpaRepository<ConsultationRoom, String> {
    List<ConsultationRoom> findByPatientUid(String patientUid);
    List<ConsultationRoom> findByDoctorUid(String doctorUid);
    List<ConsultationRoom> findByStatus(String status);
    List<ConsultationRoom> findByDoctorUidAndStatus(String doctorUid, String status);
    List<ConsultationRoom> findByPatientUidAndStatus(String patientUid, String status);
}
