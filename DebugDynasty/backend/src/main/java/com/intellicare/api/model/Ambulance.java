package com.intellicare.api.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "ambulances")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Ambulance {

    @Id
    @Column(name = "firebase_uid")
    private String firebaseUid;

    @OneToOne
    @MapsId
    @JoinColumn(name = "firebase_uid")
    private User user;

    @Column(name = "provider_name", nullable = false)
    private String providerName;

    @Column(name = "vehicle_number", unique = true, nullable = false)
    private String vehicleNumber;

    @Column(name = "driver_name")
    private String driverName;

    @Column(name = "contact_number")
    private String contactNumber;

    @Column(name = "latitude")
    private Double latitude;

    @Column(name = "longitude")
    private Double longitude;

    @Column(name = "status")
    @Builder.Default
    private String status = "AVAILABLE";

    @Column(name = "assigned_patient_uid")
    private String assignedPatientUid;

    @Column(name = "assigned_hospital_uid")
    private String assignedHospitalUid;
}
