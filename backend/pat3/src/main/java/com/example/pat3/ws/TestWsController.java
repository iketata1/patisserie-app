package com.example.pat3.ws;

import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.stereotype.Controller;

@Controller
public class TestWsController {

    // Front publie sur /app/ping → réponse sur /topic/test
    @MessageMapping("/ping")
    @SendTo("/topic/test")
    public String ping(String payload) {
        return "PONG: " + (payload == null ? "" : payload);
    }
}
