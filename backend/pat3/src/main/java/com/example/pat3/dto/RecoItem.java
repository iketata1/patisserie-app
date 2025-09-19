package com.example.pat3.dto;// com.example.pat3.dto.RecoItem
import lombok.*;

@Data @NoArgsConstructor @AllArgsConstructor
public class RecoItem {
    private String productId;
    private double score;
}