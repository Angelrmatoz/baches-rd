package com.bachesrd.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DuplicateReportResponse {

    @Builder.Default
    private String error = "DUPLICATE_REPORT";

    private String message;

    private UUID existingReportId;
}
