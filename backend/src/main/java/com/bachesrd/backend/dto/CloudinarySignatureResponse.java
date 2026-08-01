package com.bachesrd.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CloudinarySignatureResponse {

    private String signature;
    private long timestamp;
    private String apiKey;
    private String cloudName;
}
