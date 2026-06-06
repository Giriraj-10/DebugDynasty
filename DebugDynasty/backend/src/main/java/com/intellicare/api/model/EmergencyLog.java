package com.intellicare.api.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "emergency_logs")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EmergencyLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "patient_uid", nullable = false)
    private String patientUid;

    @Column(name = "patient_latitude", nullable = false)
    private Double patientLatitude;

    @Column(name = "patient_longitude", nullable = false)
    private Double patientLongitude;

    @Column(name = "ambulance_uid")
    private String ambulanceUid;

    @Column(name = "hospital_uid")
    private String hospitalUid;

    @Column(name = "status")
    @Builder.Default
    private String status = "DISPATCHED";

    @Column(name = "created_at", insertable = false, updatable = false)
    private LocalDateTime createdAt;
}
