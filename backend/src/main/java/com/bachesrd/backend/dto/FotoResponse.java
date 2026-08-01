package com.bachesrd.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FotoResponse {

    private UUID id;
    private String cloudinaryUrl;
    private String cloudinaryPublicId;
    private Boolean esFotoPrincipal;
    private Instant createdAt;
}
