package com.example.pat3.events;

import lombok.*;
import java.time.LocalDateTime;

@Data @NoArgsConstructor @AllArgsConstructor
public class OrderStatusEvent {
    private Long orderId;
    private String newStatus;
    private String previousStatus;
    private String updatedBy; // admin, par ex.
    private LocalDateTime at;
}
