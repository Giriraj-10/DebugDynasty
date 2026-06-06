package com.intellicare.api.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "blood_banks")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BloodBank {

    @Id
    @Column(name = "firebase_uid")
    private String firebaseUid;

    @OneToOne
    @MapsId
    @JoinColumn(name = "firebase_uid")
    private User user;

    @Column(name = "blood_bank_name", nullable = false)
    private String bloodBankName;

    @Column(name = "registration_number", unique = true, nullable = false)
    private String registrationNumber;

    @Column(name = "address", columnDefinition = "TEXT")
    private String address;

    @Column(name = "contact_number")
    private String contactNumber;

    @Column(name = "a_positive")
    @Builder.Default
    private Integer aPositive = 10;

    @Column(name = "a_negative")
    @Builder.Default
    private Integer aNegative = 10;

    @Column(name = "b_positive")
    @Builder.Default
    private Integer bPositive = 10;

    @Column(name = "b_negative")
    @Builder.Default
    private Integer bNegative = 10;

    @Column(name = "ab_positive")
    @Builder.Default
    private Integer abPositive = 10;

    @Column(name = "ab_negative")
    @Builder.Default
    private Integer abNegative = 10;

    @Column(name = "o_positive")
    @Builder.Default
    private Integer oPositive = 10;

    @Column(name = "o_negative")
    @Builder.Default
    private Integer oNegative = 10;
}
