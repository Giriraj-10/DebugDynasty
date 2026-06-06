package com.intellicare.api.repository;

import com.intellicare.api.model.BloodRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface BloodRequestRepository extends JpaRepository<BloodRequest, Long> {
    List<BloodRequest> findByHospitalUidOrderByIdDesc(String hospitalUid);
    List<BloodRequest> findByBloodBankUidOrderByIdDesc(String bloodBankUid);
}
