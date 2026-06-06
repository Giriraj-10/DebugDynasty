package com.intellicare.api.controller;

import com.intellicare.api.model.Ambulance;
import com.intellicare.api.repository.AmbulanceRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.util.Map;
import java.util.Optional;

@Controller
public class SOSWebSocketController {

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @Autowired
    private AmbulanceRepository ambulanceRepository;

    /**
     * Ambulances publish location updates to: /app/ambulance/{ambulanceUid}/location
     * We persist in DB and broadcast to: /topic/ambulance/{ambulanceUid}/location
     */
    @MessageMapping("/ambulance/{ambulanceUid}/location")
    public void handleAmbulanceLocationUpdate(
            @DestinationVariable String ambulanceUid,
            @Payload Map<String, Object> payload) {

        try {
            Double lat = ((Number) payload.get("latitude")).doubleValue();
            Double lon = ((Number) payload.get("longitude")).doubleValue();

            Optional<Ambulance> ambOpt = ambulanceRepository.findById(ambulanceUid);
            if (ambOpt.isPresent()) {
                Ambulance ambulance = ambOpt.get();
                ambulance.setLatitude(lat);
                ambulance.setLongitude(lon);
                ambulanceRepository.save(ambulance);

                // Broadcast location back to anyone listening (e.g. patients)
                messagingTemplate.convertAndSend(
                    "/topic/ambulance/" + ambulanceUid + "/location",
                    Map.of(
                        "ambulanceUid", ambulanceUid,
                        "latitude", lat,
                        "longitude", lon,
                        "timestamp", System.currentTimeMillis()
                    )
                );
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    /**
     * Alternate handler: /app/ambulance/location  (ambulanceUid in payload body)
     */
    @MessageMapping("/ambulance/location")
    public void handleAmbulanceLocationUpdateByBody(@Payload Map<String, Object> payload) {
        try {
            String ambulanceUid = (String) payload.get("ambulanceUid");
            if (ambulanceUid == null) return;

            Double lat = ((Number) payload.get("latitude")).doubleValue();
            Double lon = ((Number) payload.get("longitude")).doubleValue();

            ambulanceRepository.findById(ambulanceUid).ifPresent(a -> {
                a.setLatitude(lat);
                a.setLongitude(lon);
                ambulanceRepository.save(a);
            });

            messagingTemplate.convertAndSend(
                "/topic/ambulance/" + ambulanceUid + "/location",
                Map.of(
                    "ambulanceUid", ambulanceUid,
                    "latitude", lat,
                    "longitude", lon,
                    "timestamp", System.currentTimeMillis()
                )
            );
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}

