package com.example.pat3.controller;

import com.example.pat3.dto.RecoItem;
import com.example.pat3.dto.RecoRequest;
import com.example.pat3.dto.RecoResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;

import java.util.List;

@Slf4j
@CrossOrigin(origins = "http://localhost:4200")
@RestController
@RequestMapping("/api")
public class RecommendController {

    @PostMapping(path = "/recommend", consumes = MediaType.APPLICATION_JSON_VALUE,
            produces = MediaType.APPLICATION_JSON_VALUE)
    public Mono<RecoResponse> recommend(@RequestBody RecoRequest req) {
        log.info(">>> /api/recommend history={}, k={}", req.getHistory(), req.getK());

        // ⚠️ mets ici des IDs qui existent réellement dans ta table products
        List<RecoItem> items = List.of(
                new RecoItem("2", 0.9),
                new RecoItem("5", 0.7)
        );
        return Mono.just(new RecoResponse(items));
    }

    @PostMapping(path = "/reco/event", consumes = MediaType.APPLICATION_JSON_VALUE)
    public Mono<Object> logEvent(@RequestBody Object event) {
        log.info(">>> /api/reco/event {}", event);
        return Mono.just(new Object()); // stub OK
    }
}
