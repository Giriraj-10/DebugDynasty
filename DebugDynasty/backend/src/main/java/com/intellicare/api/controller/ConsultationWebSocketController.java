package com.intellicare.api.controller;

import com.intellicare.api.model.ConsultationMessage;
import com.intellicare.api.model.ConsultationRoom;
import com.intellicare.api.repository.ConsultationMessageRepository;
import com.intellicare.api.repository.ConsultationRoomRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.Optional;

/**
 * WebSocket controller for real-time consultation messages.
 * Handles STOMP messages from /app/consultation/* destinations.
 */
@Controller
public class ConsultationWebSocketController {

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @Autowired
    private ConsultationMessageRepository messageRepository;

    @Autowired
    private ConsultationRoomRepository roomRepository;

    /**
     * Handle incoming chat message.
     * Clients send to: /app/consultation/{roomId}/send
     * Message is broadcast to: /topic/consultation/{roomId}
     */
    @MessageMapping("/consultation/{roomId}/send")
    public void handleChatMessage(
            @DestinationVariable String roomId,
            @Payload Map<String, String> payload) {

        String senderUid = payload.getOrDefault("senderUid", "unknown");
        String senderRole = payload.getOrDefault("senderRole", "PATIENT");
        String messageText = payload.getOrDefault("messageText", "");
        String senderName = payload.getOrDefault("senderName", "User");

        if (messageText.isBlank()) return;

        // Verify room exists
        Optional<ConsultationRoom> roomOpt = roomRepository.findById(roomId);
        if (roomOpt.isEmpty()) {
            // Room not found - send error back
            messagingTemplate.convertAndSend(
                "/topic/consultation/" + roomId,
                Map.of("type", "ERROR", "message", "Room not found")
            );
            return;
        }

        // Persist the message
        ConsultationMessage saved = null;
        try {
            ConsultationMessage msg = ConsultationMessage.builder()
                    .roomId(roomId)
                    .senderUid(senderUid)
                    .senderRole(senderRole)
                    .messageText(messageText)
                    .build();
            saved = messageRepository.save(msg);
        } catch (Exception e) {
            // Could not persist, still relay
        }

        // Broadcast to all subscribers of this room
        messagingTemplate.convertAndSend(
            "/topic/consultation/" + roomId,
            Map.of(
                "type", "MESSAGE",
                "id", saved != null ? saved.getId() : System.currentTimeMillis(),
                "roomId", roomId,
                "senderUid", senderUid,
                "senderRole", senderRole,
                "senderName", senderName,
                "messageText", messageText,
                "timestamp", LocalDateTime.now().toString()
            )
        );
    }

    /**
     * Handle typing indicator.
     * Clients send to: /app/consultation/{roomId}/typing
     * Broadcast to: /topic/consultation/{roomId}/typing
     */
    @MessageMapping("/consultation/{roomId}/typing")
    public void handleTyping(
            @DestinationVariable String roomId,
            @Payload Map<String, Object> payload) {

        String senderUid = (String) payload.getOrDefault("senderUid", "unknown");
        String senderRole = (String) payload.getOrDefault("senderRole", "PATIENT");
        Boolean isTyping = (Boolean) payload.getOrDefault("isTyping", false);

        messagingTemplate.convertAndSend(
            "/topic/consultation/" + roomId + "/typing",
            Map.of(
                "type", "TYPING",
                "senderUid", senderUid,
                "senderRole", senderRole,
                "isTyping", isTyping
            )
        );
    }

    /**
     * Handle online/presence status update.
     * Clients send to: /app/consultation/{roomId}/status
     */
    @MessageMapping("/consultation/{roomId}/status")
    public void handleStatusUpdate(
            @DestinationVariable String roomId,
            @Payload Map<String, Object> payload) {

        String senderUid = (String) payload.getOrDefault("senderUid", "unknown");
        String senderRole = (String) payload.getOrDefault("senderRole", "PATIENT");
        String status = (String) payload.getOrDefault("status", "ONLINE");

        messagingTemplate.convertAndSend(
            "/topic/consultation/" + roomId + "/status",
            Map.of(
                "type", "STATUS",
                "senderUid", senderUid,
                "senderRole", senderRole,
                "status", status
            )
        );
    }
}
