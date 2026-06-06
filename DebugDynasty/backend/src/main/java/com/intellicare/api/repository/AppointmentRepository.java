package com.intellicare.api.repository;

import com.intellicare.api.model.Appointment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface AppointmentRepository extends JpaRepository<Appointment, Long> {
    List<Appointment> findByPatientUid(String patientUid);
    List<Appointment> findByPatientUidOrderByIdDesc(String patientUid);
    List<Appointment> findByDoctorUid(String doctorUid);
}
