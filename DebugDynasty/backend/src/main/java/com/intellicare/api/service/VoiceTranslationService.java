package com.intellicare.api.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;

import java.util.*;

@Service
public class VoiceTranslationService {

    private static final Logger logger = LoggerFactory.getLogger(VoiceTranslationService.class);

    @Value("${openai.api-key}")
    private String openAiKey;

    @Value("${sarvam.api-key}")
    private String sarvamKey;

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    // Tiny silent 1-sec WAV base64 as fallback audio data
    private static final String SILENT_WAV_BASE64 = 
        "UklGRigAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=";

    public boolean isMockMode() {
        return openAiKey == null || openAiKey.isBlank() || openAiKey.contains("your-key-here") 
            || sarvamKey == null || sarvamKey.isBlank() || sarvamKey.contains("your-key-here");
    }

    public String transcribeAudio(byte[] audioBytes, String filename) {
        if (isMockMode()) {
            logger.info("[Mock Mode] Transcribing audio file: {}", filename);
            return "Hello Doctor, I have been feeling slightly feverish and having body aches since yesterday morning.";
        }

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.MULTIPART_FORM_DATA);
            headers.setBearerAuth(openAiKey);

            ByteArrayResource fileResource = new ByteArrayResource(audioBytes) {
                @Override
                public String getFilename() {
                    return filename != null ? filename : "voice.webm";
                }
            };

            MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
            body.add("file", fileResource);
            body.add("model", "whisper-1");

            HttpEntity<MultiValueMap<String, Object>> requestEntity = new HttpEntity<>(body, headers);
            ResponseEntity<String> response = restTemplate.postForEntity(
                "https://api.openai.com/v1/audio/transcriptions", 
                requestEntity, 
                String.class
            );

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                JsonNode root = objectMapper.readTree(response.getBody());
                return root.path("text").asText();
            } else {
                throw new RuntimeException("Whisper STT failed with status: " + response.getStatusCode());
            }
        } catch (Exception e) {
            logger.error("Error transcribing audio, falling back to mock", e);
            return "Hello, I am testing the voice consultation transcription fallback.";
        }
    }

    public String translateText(String text, String targetLanguageName) {
        if (isMockMode()) {
            logger.info("[Mock Mode] Translating text to: {}", targetLanguageName);
            return getMockTranslation(text, targetLanguageName);
        }

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(openAiKey);

            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("model", "gpt-4o");

            List<Map<String, String>> messages = new ArrayList<>();
            messages.add(Map.of(
                "role", "system",
                "content", "You are a professional medical translator. Translate the user's message from its source language directly into the target language. Do not add any commentary, explanations, or formatting. Only return the translated text itself. The target language is: " + targetLanguageName
            ));
            messages.add(Map.of(
                "role", "user",
                "content", text
            ));
            requestBody.put("messages", messages);

            HttpEntity<Map<String, Object>> requestEntity = new HttpEntity<>(requestBody, headers);
            ResponseEntity<String> response = restTemplate.postForEntity(
                "https://api.openai.com/v1/chat/completions",
                requestEntity,
                String.class
            );

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                JsonNode root = objectMapper.readTree(response.getBody());
                return root.path("choices").path(0).path("message").path("content").asText().trim();
            } else {
                throw new RuntimeException("GPT-4o translation failed with status: " + response.getStatusCode());
            }
        } catch (Exception e) {
            logger.error("Error translating text, falling back to mock", e);
            return getMockTranslation(text, targetLanguageName);
        }
    }

    public String synthesizeSpeech(String text, String targetLanguageCode) {
        if (isMockMode()) {
            logger.info("[Mock Mode] Synthesizing speech in language: {} for text: {}", targetLanguageCode, text);
            return SILENT_WAV_BASE64;
        }

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("api-subscription-key", sarvamKey);

            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("text", text);
            requestBody.put("model", "bulbul:v3");
            requestBody.put("target_language_code", targetLanguageCode);
            requestBody.put("speaker", "ritu");
            requestBody.put("pace", 1.0);

            HttpEntity<Map<String, Object>> requestEntity = new HttpEntity<>(requestBody, headers);
            ResponseEntity<String> response = restTemplate.postForEntity(
                "https://api.sarvam.ai/text-to-speech",
                requestEntity,
                String.class
            );

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                JsonNode root = objectMapper.readTree(response.getBody());
                JsonNode audiosNode = root.path("audios");
                if (audiosNode.isArray() && audiosNode.size() > 0) {
                    return audiosNode.get(0).asText();
                } else {
                    throw new RuntimeException("Sarvam AI TTS response did not contain audio array");
                }
            } else {
                throw new RuntimeException("Sarvam AI TTS failed with status: " + response.getStatusCode());
            }
        } catch (Exception e) {
            logger.error("Error synthesizing speech, falling back to mock silent audio", e);
            return SILENT_WAV_BASE64;
        }
    }

    private String getMockTranslation(String text, String targetLanguage) {
        String lang = targetLanguage != null ? targetLanguage.toLowerCase() : "";
        if (lang.contains("hindi") || lang.contains("hi")) {
            return "नमस्ते डॉक्टर, (सिम्युलेटेड अनुवाद): " + text;
        } else if (lang.contains("marathi") || lang.contains("mr")) {
            return "नमस्कार डॉक्टर, (सिम्युलेटेड अनुवाद): " + text;
        } else if (lang.contains("tamil") || lang.contains("ta")) {
            return "வணக்கம் டாக்டர், (சிமுலேட்டட் மொழிபெயர்ப்பு): " + text;
        } else if (lang.contains("telugu") || lang.contains("te")) {
            return "నమస్కారం డాక్టర్, (అనుకరణ అనువాదం): " + text;
        } else if (lang.contains("bengali") || lang.contains("bn")) {
            return "নমস্কার ডাক্তার, (সিমুলেটেড অনুবাদ): " + text;
        } else if (lang.contains("gujarati") || lang.contains("gu")) {
            return "નમસ્તે ડોક્ટર, (સિમ્યુલેટેડ અનુવાદ): " + text;
        } else if (lang.contains("punjabi") || lang.contains("pa")) {
            return "ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ ਡਾਕਟਰ, (ਸਿਮੂਲੇਟਡ ਅਨੁਵਾਦ): " + text;
        } else if (lang.contains("kannada") || lang.contains("kn")) {
            return "ನಮಸ್ಕಾರ ಡಾಕ್ಟರ್, (ಅನುಕರಿಸಿದ ಅನುವಾದ): " + text;
        } else if (lang.contains("malayalam") || lang.contains("ml")) {
            return "നമസ്കാരം ഡോക്ടർ, (സിമുലേറ്റഡ് വിവർത്തനം): " + text;
        } else {
            return "Hello, (Simulated Translation to " + targetLanguage + "): " + text;
        }
    }

    public static String getLanguageCode(String lang) {
        if (lang == null) return "en-IN";
        switch (lang.toLowerCase()) {
            case "hindi":
            case "hi":
            case "hi-in":
                return "hi-IN";
            case "marathi":
            case "mr":
            case "mr-in":
                return "mr-IN";
            case "tamil":
            case "ta":
            case "ta-in":
                return "ta-IN";
            case "telugu":
            case "te":
            case "te-in":
                return "te-IN";
            case "bengali":
            case "bn":
            case "bn-in":
                return "bn-IN";
            case "gujarati":
            case "gu":
            case "gu-in":
                return "gu-IN";
            case "punjabi":
            case "pa":
            case "pa-in":
                return "pa-IN";
            case "kannada":
            case "kn":
            case "kn-in":
                return "kn-IN";
            case "malayalam":
            case "ml":
            case "ml-in":
                return "ml-IN";
            case "english":
            case "en":
            case "en-in":
            default:
                return "en-IN";
        }
    }

    public static String getLanguageName(String lang) {
        if (lang == null) return "English";
        switch (lang.toLowerCase()) {
            case "hindi":
            case "hi":
            case "hi-in":
                return "Hindi";
            case "marathi":
            case "mr":
            case "mr-in":
                return "Marathi";
            case "tamil":
            case "ta":
            case "ta-in":
                return "Tamil";
            case "telugu":
            case "te":
            case "te-in":
                return "Telugu";
            case "bengali":
            case "bn":
            case "bn-in":
                return "Bengali";
            case "gujarati":
            case "gu":
            case "gu-in":
                return "Gujarati";
            case "punjabi":
            case "pa":
            case "pa-in":
                return "Punjabi";
            case "kannada":
            case "kn":
            case "kn-in":
                return "Kannada";
            case "malayalam":
            case "ml":
            case "ml-in":
                return "Malayalam";
            case "english":
            case "en":
            case "en-in":
            default:
                return "English";
        }
    }
}
