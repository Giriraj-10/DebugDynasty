package com.intellicare.api.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "prescriptions")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Prescription {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "patient_uid", nullable = false)
    private String patientUid;

    @Column(name = "doctor_uid", nullable = false)
    private String doctorUid;

    @Column(name = "medicines", nullable = false, columnDefinition = "TEXT")
    private String medicines;

    @Column(name = "dosage", nullable = false)
    private String dosage;

    @Column(name = "instructions", nullable = false)
    private String instructions;

    @Column(name = "duration", nullable = false)
    private String duration;

    @Column(name = "created_at")
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}
