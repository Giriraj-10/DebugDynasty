package com.intellicare.api.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "appointments")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Appointment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "patient_uid", nullable = false)
    private String patientUid;

    @Column(name = "doctor_uid", nullable = false)
    private String doctorUid;

    @Column(name = "appointment_date", nullable = false)
    private String appointmentDate;

    @Column(name = "time_slot", nullable = false)
    private String timeSlot;

    @Column(name = "status", nullable = false)
    @Builder.Default
    private String status = "PENDING"; // PENDING, ACCEPTED, REJECTED

    @Column(name = "created_at", insertable = false, updatable = false)
    private LocalDateTime createdAt;
}
