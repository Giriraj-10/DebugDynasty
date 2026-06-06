package com.intellicare.api.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "doctors")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Doctor {

    @Id
    @Column(name = "firebase_uid")
    private String firebaseUid;

    @OneToOne
    @MapsId
    @JoinColumn(name = "firebase_uid")
    private User user;

    @Column(name = "full_name", nullable = false)
    private String fullName;

    @Column(name = "phone")
    private String phone;

    @Column(name = "medical_registration_number", unique = true, nullable = false)
    private String medicalRegistrationNumber;

    @Column(name = "degree_certificate_url")
    private String degreeCertificateUrl;

    @Column(name = "experience_years")
    private Integer experienceYears;

    @Column(name = "specialization")
    private String specialization;

    @Column(name = "preferred_language")
    private String preferredLanguage;

    @Column(name = "online_status", nullable = false)
    @Builder.Default
    private Boolean onlineStatus = true;
}
