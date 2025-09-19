package com.example.pat3.dto;

import lombok.Data;

@Data
public class RecoEvent {
    private Integer userId;
    private String productId;
    private String type; // view | click | add_to_cart | purchase
    private Double ts;   // epoch seconds
}
