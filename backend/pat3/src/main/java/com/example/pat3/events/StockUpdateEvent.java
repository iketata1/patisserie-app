package com.example.pat3.events;

import lombok.*;

@Data @NoArgsConstructor @AllArgsConstructor
public class StockUpdateEvent {
    private Long productId;
    private int newStock;
}
