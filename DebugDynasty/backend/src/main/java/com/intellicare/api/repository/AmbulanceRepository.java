package com.intellicare.api.repository;

import com.intellicare.api.model.Ambulance;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface AmbulanceRepository extends JpaRepository<Ambulance, String> {
}
