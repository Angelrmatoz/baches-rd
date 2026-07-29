package com.bachesrd.backend.dto;

import com.bachesrd.backend.entity.EstadoReporte;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdateStatusRequest {

    @NotNull(message = "El nuevo estado es requerido")
    private EstadoReporte estado;
}
