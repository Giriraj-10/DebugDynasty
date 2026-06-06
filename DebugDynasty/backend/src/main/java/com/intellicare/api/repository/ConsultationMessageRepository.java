package com.intellicare.api.repository;

import com.intellicare.api.model.ConsultationMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ConsultationMessageRepository extends JpaRepository<ConsultationMessage, Long> {
    List<ConsultationMessage> findByRoomIdOrderByTimestampAsc(String roomId);
    List<ConsultationMessage> findByRoomId(String roomId);
}
