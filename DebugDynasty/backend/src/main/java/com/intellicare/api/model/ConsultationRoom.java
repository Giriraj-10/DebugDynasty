package com.intellicare.api.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "consultation_rooms")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ConsultationRoom {

    @Id
    private String id; // String representation, e.g. UUID

    @Column(name = "patient_uid", nullable = false)
    private String patientUid;

    @Column(name = "doctor_uid", nullable = false)
    private String doctorUid;

    @Column(name = "status", nullable = false)
    @Builder.Default
    private String status = "REQUESTED"; // REQUESTED, ACTIVE, COMPLETED

    @Column(name = "created_at", insertable = false, updatable = false)
    private LocalDateTime createdAt;
}
