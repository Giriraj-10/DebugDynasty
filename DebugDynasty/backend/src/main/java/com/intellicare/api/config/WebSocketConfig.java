package com.intellicare.api.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.*;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        // Enable a simple in-memory message broker with destination prefix /topic
        config.enableSimpleBroker("/topic", "/queue");
        // Client messages prefixed with /app are routed to @MessageMapping methods
        config.setApplicationDestinationPrefixes("/app");
        // User-specific destinations
        config.setUserDestinationPrefix("/user");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws/consultation")
                .setAllowedOriginPatterns("http://localhost:5173", "http://localhost:*")
                .withSockJS();
    }
}
