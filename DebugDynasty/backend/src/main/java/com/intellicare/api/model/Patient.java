package com.intellicare.api.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "patients")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Patient {

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

    @Column(name = "age")
    private Integer age;

    @Column(name = "blood_group")
    private String bloodGroup;

    @Column(name = "preferred_language")
    @Builder.Default
    private String preferredLanguage = "English";
}
