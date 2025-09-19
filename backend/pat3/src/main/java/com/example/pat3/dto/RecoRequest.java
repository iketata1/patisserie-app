package com.example.pat3.dto;

import lombok.Data;
import java.util.List;

@Data
public class RecoRequest {
    private Integer userId;
    private List<String> history;
    private Integer k = 5;
}
