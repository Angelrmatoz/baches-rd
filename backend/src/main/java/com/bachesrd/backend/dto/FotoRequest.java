package com.bachesrd.backend.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FotoRequest {

    @NotBlank(message = "La URL de Cloudinary es requerida")
    private String cloudinaryUrl;

    @NotBlank(message = "El public_id de Cloudinary es requerido")
    private String cloudinaryPublicId;

    @Builder.Default
    private Boolean esFotoPrincipal = false;
}
