package com.intellicare.api.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "blood_requests")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BloodRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "hospital_uid", nullable = false)
    private String hospitalUid;

    @Column(name = "blood_bank_uid", nullable = false)
    private String bloodBankUid;

    @Column(name = "blood_group", nullable = false)
    private String bloodGroup;

    @Column(name = "required_units", nullable = false)
    private Integer requiredUnits;

    @Column(name = "status")
    @Builder.Default
    private String status = "PENDING";

    @Column(name = "created_at")
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}
