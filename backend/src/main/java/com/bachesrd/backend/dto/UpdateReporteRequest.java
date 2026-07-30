package com.bachesrd.backend.dto;

import com.bachesrd.backend.entity.Severidad;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdateReporteRequest {

    @Size(max = 1000, message = "La descripción no puede exceder los 1000 caracteres")
    private String descripcion;

    @Size(max = 500, message = "La dirección aproximada no puede exceder los 500 caracteres")
    private String direccionAprox;

    private Severidad severidad;
}
