package com.intellicare.api.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "hospitals")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Hospital {

    @Id
    @Column(name = "firebase_uid")
    private String firebaseUid;

    @OneToOne
    @MapsId
    @JoinColumn(name = "firebase_uid")
    private User user;

    @Column(name = "hospital_name", nullable = false)
    private String hospitalName;

    @Column(name = "registration_number", unique = true, nullable = false)
    private String registrationNumber;

    @Column(name = "address", columnDefinition = "TEXT")
    private String address;

    @Column(name = "contact_number")
    private String contactNumber;

    @Column(name = "latitude")
    private Double latitude;

    @Column(name = "longitude")
    private Double longitude;

    @Column(name = "total_beds")
    @Builder.Default
    private Integer totalBeds = 100;

    @Column(name = "available_beds")
    @Builder.Default
    private Integer availableBeds = 10;
}
