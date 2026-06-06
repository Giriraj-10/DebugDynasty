package com.intellicare.api.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "consultation_messages")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ConsultationMessage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "room_id", nullable = false)
    private String roomId;

    @Column(name = "sender_uid", nullable = false)
    private String senderUid;

    @Column(name = "sender_role", nullable = false)
    private String senderRole;

    @Column(name = "message_text", nullable = false)
    private String messageText;

    @Column(name = "message_type")
    @Builder.Default
    private String messageType = "TEXT";

    @Column(name = "original_text")
    private String originalText;

    @Column(name = "translated_text")
    private String translatedText;

    @Lob
    @Column(name = "audio_data")
    private String audioData;

    @Column(name = "timestamp", insertable = false, updatable = false)
    private LocalDateTime timestamp;
}
