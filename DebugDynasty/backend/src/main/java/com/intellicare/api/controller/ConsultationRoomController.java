package com.intellicare.api.controller;

import com.intellicare.api.model.ConsultationMessage;
import com.intellicare.api.model.ConsultationRoom;
import com.intellicare.api.model.Doctor;
import com.intellicare.api.model.Patient;
import com.intellicare.api.repository.ConsultationMessageRepository;
import com.intellicare.api.repository.ConsultationRoomRepository;
import com.intellicare.api.repository.DoctorRepository;
import com.intellicare.api.repository.PatientRepository;
import com.intellicare.api.service.VoiceTranslationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.*;

import java.util.*;

/**
 * REST controller for consultation room lifecycle management.
 * Complements ConsultationWebSocketController for CRUD operations.
 */
@RestController
@RequestMapping("/api/consultation-rooms")
@CrossOrigin(origins = "http://localhost:5173", allowCredentials = "true")
public class ConsultationRoomController {

    @Autowired
    private ConsultationRoomRepository roomRepository;

    @Autowired
    private ConsultationMessageRepository messageRepository;

    @Autowired
    private DoctorRepository doctorRepository;

    @Autowired
    private PatientRepository patientRepository;

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @Autowired
    private VoiceTranslationService voiceTranslationService;

    /**
     * Patient initiates an immediate consultation request.
     * POST /api/consultation-rooms/request
     * Body: { patientUid, doctorUid }
     */
    @PostMapping("/request")
    public ResponseEntity<?> requestConsultation(@RequestBody Map<String, String> payload) {
        try {
            String patientUid = payload.get("patientUid");
            String doctorUid = payload.get("doctorUid");
            String patientName = payload.getOrDefault("patientName", "Patient");
            String doctorName = payload.getOrDefault("doctorName", "Doctor");

            if (patientUid == null || doctorUid == null) {
                return ResponseEntity.badRequest().body(Map.of("message", "patientUid and doctorUid required"));
            }

            // Create unique room ID
            String roomId = "room-" + patientUid.substring(0, Math.min(6, patientUid.length()))
                    + "-" + doctorUid.substring(0, Math.min(6, doctorUid.length()))
                    + "-" + System.currentTimeMillis();

            ConsultationRoom room = ConsultationRoom.builder()
                    .id(roomId)
                    .patientUid(patientUid)
                    .doctorUid(doctorUid)
                    .status("REQUESTED")
                    .build();

            room = roomRepository.save(room);

            // Notify doctor via WebSocket that a consultation request arrived
            messagingTemplate.convertAndSend(
                "/topic/doctor/" + doctorUid + "/requests",
                Map.of(
                    "type", "CONSULTATION_REQUEST",
                    "roomId", roomId,
                    "patientUid", patientUid,
                    "patientName", patientName,
                    "doctorName", doctorName,
                    "timestamp", new Date().toString()
                )
            );

            return ResponseEntity.ok(room);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("message", e.getMessage()));
        }
    }

    /**
     * Doctor accepts a consultation request.
     * PUT /api/consultation-rooms/{roomId}/accept
     */
    @PutMapping("/{roomId}/accept")
    public ResponseEntity<?> acceptConsultation(@PathVariable String roomId, @RequestBody(required = false) Map<String, String> payload) {
        Optional<ConsultationRoom> roomOpt = roomRepository.findById(roomId);
        if (roomOpt.isEmpty()) return ResponseEntity.notFound().build();

        ConsultationRoom room = roomOpt.get();
        room.setStatus("ACTIVE");
        roomRepository.save(room);

        String doctorName = payload != null ? payload.getOrDefault("doctorName", "Doctor") : "Doctor";

        // Notify the patient that doctor accepted
        messagingTemplate.convertAndSend(
            "/topic/consultation/" + roomId,
            Map.of(
                "type", "ROOM_ACCEPTED",
                "roomId", roomId,
                "doctorName", doctorName,
                "message", "Doctor has accepted your consultation request. You can now chat."
            )
        );

        return ResponseEntity.ok(room);
    }

    /**
     * Doctor or patient ends consultation.
     * PUT /api/consultation-rooms/{roomId}/end
     */
    @PutMapping("/{roomId}/end")
    public ResponseEntity<?> endConsultation(@PathVariable String roomId) {
        Optional<ConsultationRoom> roomOpt = roomRepository.findById(roomId);
        if (roomOpt.isEmpty()) return ResponseEntity.notFound().build();

        ConsultationRoom room = roomOpt.get();
        room.setStatus("COMPLETED");
        roomRepository.save(room);

        // Notify both parties
        messagingTemplate.convertAndSend(
            "/topic/consultation/" + roomId,
            Map.of(
                "type", "ROOM_ENDED",
                "roomId", roomId,
                "message", "Consultation session has ended."
            )
        );

        return ResponseEntity.ok(room);
    }

    /**
     * Get a specific room by ID.
     */
    @GetMapping("/{roomId}")
    public ResponseEntity<?> getRoomById(@PathVariable String roomId) {
        return roomRepository.findById(roomId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Get all rooms for a doctor (with enriched patient details).
     */
    @GetMapping("/doctor/{doctorUid}")
    public ResponseEntity<List<Map<String, Object>>> getDoctorRooms(@PathVariable String doctorUid) {
        List<ConsultationRoom> rooms = roomRepository.findByDoctorUid(doctorUid);
        List<Map<String, Object>> response = new ArrayList<>();

        for (ConsultationRoom room : rooms) {
            Map<String, Object> map = new HashMap<>();
            map.put("id", room.getId());
            map.put("patientUid", room.getPatientUid());
            map.put("doctorUid", room.getDoctorUid());
            map.put("status", room.getStatus());
            map.put("createdAt", room.getCreatedAt());

            // Enrich with patient info
            patientRepository.findById(room.getPatientUid()).ifPresent(p -> {
                map.put("patientName", p.getFullName());
                map.put("patientPhone", p.getPhone());
                map.put("patientAge", p.getAge());
                map.put("patientBloodGroup", p.getBloodGroup());
            });

            // Message count
            map.put("messageCount", messageRepository.findByRoomId(room.getId()).size());
            response.add(map);
        }
        return ResponseEntity.ok(response);
    }

    /**
     * Get all rooms for a patient.
     */
    @GetMapping("/patient/{patientUid}")
    public ResponseEntity<List<Map<String, Object>>> getPatientRooms(@PathVariable String patientUid) {
        List<ConsultationRoom> rooms = roomRepository.findByPatientUid(patientUid);
        List<Map<String, Object>> response = new ArrayList<>();

        for (ConsultationRoom room : rooms) {
            Map<String, Object> map = new HashMap<>();
            map.put("id", room.getId());
            map.put("patientUid", room.getPatientUid());
            map.put("doctorUid", room.getDoctorUid());
            map.put("status", room.getStatus());
            map.put("createdAt", room.getCreatedAt());

            // Enrich with doctor info
            doctorRepository.findById(room.getDoctorUid()).ifPresent(d -> {
                map.put("doctorName", d.getFullName());
                map.put("doctorSpecialization", d.getSpecialization());
            });

            // Message count
            map.put("messageCount", messageRepository.findByRoomId(room.getId()).size());
            response.add(map);
        }
        return ResponseEntity.ok(response);
    }

    /**
     * Get all chat messages in a room.
     */
    @GetMapping("/{roomId}/messages")
    public ResponseEntity<List<ConsultationMessage>> getRoomMessages(@PathVariable String roomId) {
        List<ConsultationMessage> messages = messageRepository.findByRoomIdOrderByTimestampAsc(roomId);
        return ResponseEntity.ok(messages);
    }

    /**
     * Get pending consultation requests for a doctor.
     */
    @GetMapping("/doctor/{doctorUid}/pending")
    public ResponseEntity<List<Map<String, Object>>> getPendingRequests(@PathVariable String doctorUid) {
        List<ConsultationRoom> rooms = roomRepository.findByDoctorUidAndStatus(doctorUid, "REQUESTED");
        List<Map<String, Object>> response = new ArrayList<>();

        for (ConsultationRoom room : rooms) {
            Map<String, Object> map = new HashMap<>();
            map.put("id", room.getId());
            map.put("patientUid", room.getPatientUid());
            map.put("status", room.getStatus());
            map.put("createdAt", room.getCreatedAt());

            patientRepository.findById(room.getPatientUid()).ifPresent(p -> {
                map.put("patientName", p.getFullName());
                map.put("patientAge", p.getAge());
                map.put("patientBloodGroup", p.getBloodGroup());
            });
            response.add(map);
        }
        return ResponseEntity.ok(response);
    }

    /**
     * Endpoint to upload a voice message, process it, translate, synthesize,
     * save to DB, and broadcast it.
     * POST /api/consultation-rooms/{roomId}/voice
     */
    @PostMapping(value = "/{roomId}/voice", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> processVoiceMessage(
            @PathVariable String roomId,
            @RequestParam("file") org.springframework.web.multipart.MultipartFile file,
            @RequestParam("senderUid") String senderUid,
            @RequestParam("senderRole") String senderRole,
            @RequestParam("senderName") String senderName) {
        try {
            Optional<ConsultationRoom> roomOpt = roomRepository.findById(roomId);
            if (roomOpt.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("message", "Room not found"));
            }
            ConsultationRoom room = roomOpt.get();

            String senderLanguage = "English";
            String targetLanguage = "English";

            Optional<Patient> patientOpt = patientRepository.findById(room.getPatientUid());
            Optional<Doctor> doctorOpt = doctorRepository.findById(room.getDoctorUid());

            String patientLanguage = patientOpt.isPresent() ? patientOpt.get().getPreferredLanguage() : "English";
            String doctorLanguage = doctorOpt.isPresent() ? doctorOpt.get().getPreferredLanguage() : "English";

            if (senderRole.equalsIgnoreCase("PATIENT")) {
                senderLanguage = patientLanguage;
                targetLanguage = doctorLanguage;
            } else {
                senderLanguage = doctorLanguage;
                targetLanguage = patientLanguage;
            }

            byte[] audioBytes = file.getBytes();
            String transcribedText = voiceTranslationService.transcribeAudio(audioBytes, file.getOriginalFilename());

            if (transcribedText == null || transcribedText.isBlank()) {
                return ResponseEntity.badRequest().body(Map.of("message", "Failed to transcribe audio or audio is empty"));
            }

            String translatedText = transcribedText;
            if (!senderLanguage.equalsIgnoreCase(targetLanguage)) {
                translatedText = voiceTranslationService.translateText(transcribedText, VoiceTranslationService.getLanguageName(targetLanguage));
            }

            String targetLanguageCode = VoiceTranslationService.getLanguageCode(targetLanguage);
            String synthesizedAudioBase64 = voiceTranslationService.synthesizeSpeech(translatedText, targetLanguageCode);

            ConsultationMessage msg = ConsultationMessage.builder()
                    .roomId(roomId)
                    .senderUid(senderUid)
                    .senderRole(senderRole.toUpperCase())
                    .messageText(translatedText)
                    .messageType("VOICE")
                    .originalText(transcribedText)
                    .translatedText(translatedText)
                    .audioData(synthesizedAudioBase64)
                    .build();

            ConsultationMessage saved = messageRepository.save(msg);

            Map<String, Object> wsPayload = new HashMap<>();
            wsPayload.put("type", "MESSAGE");
            wsPayload.put("id", saved.getId());
            wsPayload.put("roomId", roomId);
            wsPayload.put("senderUid", senderUid);
            wsPayload.put("senderRole", senderRole.toUpperCase());
            wsPayload.put("senderName", senderName);
            wsPayload.put("messageText", translatedText);
            wsPayload.put("messageType", "VOICE");
            wsPayload.put("originalText", transcribedText);
            wsPayload.put("translatedText", translatedText);
            wsPayload.put("audioData", synthesizedAudioBase64);
            wsPayload.put("timestamp", java.time.LocalDateTime.now().toString());

            messagingTemplate.convertAndSend("/topic/consultation/" + roomId, wsPayload);

            return ResponseEntity.ok(wsPayload);

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body(Map.of("message", e.getMessage()));
        }
    }
}
