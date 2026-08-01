package com.bachesrd.backend.exception;

import lombok.Getter;

import java.util.UUID;

@Getter
public class DuplicateReportException extends RuntimeException {

    private final UUID existingReportId;

    public DuplicateReportException(String message, UUID existingReportId) {
        super(message);
        this.existingReportId = existingReportId;
    }
}
