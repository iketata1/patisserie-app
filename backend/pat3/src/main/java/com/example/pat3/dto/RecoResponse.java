package com.example.pat3.dto;// com.example.pat3.dto.RecoResponse
import lombok.*;

@Data @NoArgsConstructor @AllArgsConstructor
public class RecoResponse {
    private java.util.List<RecoItem> items;
}