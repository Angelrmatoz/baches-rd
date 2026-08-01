package com.bachesrd.backend.dto;

import com.bachesrd.backend.entity.Severidad;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReporteRequest {

    @NotNull(message = "La latitud es requerida")
    @Min(value = -90, message = "La latitud debe ser mayor o igual a -90")
    @Max(value = 90, message = "La latitud debe ser menor o igual a 90")
    private BigDecimal latitud;

    @NotNull(message = "La longitud es requerida")
    @Min(value = -180, message = "La longitud debe ser mayor o igual a -180")
    @Max(value = 180, message = "La longitud debe ser menor o igual a 180")
    private BigDecimal longitud;

    @Size(max = 1000, message = "La descripción no puede exceder los 1000 caracteres")
    private String descripcion;

    @Size(max = 500, message = "La dirección aproximada no puede exceder los 500 caracteres")
    private String direccionAprox;

    @Builder.Default
    private Severidad severidad = Severidad.MEDIA;
}
