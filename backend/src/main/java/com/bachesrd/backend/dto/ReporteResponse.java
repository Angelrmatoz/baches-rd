package com.bachesrd.backend.dto;

import com.bachesrd.backend.entity.EstadoReporte;
import com.bachesrd.backend.entity.Severidad;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReporteResponse {

    private UUID id;
    private UsuarioResponse usuario;
    private String descripcion;
    private BigDecimal latitud;
    private BigDecimal longitud;
    private String direccionAprox;
    private Severidad severidad;
    private EstadoReporte estado;
    private Integer totalValidaciones;
    private Boolean validadoPorUsuarioActual;
    private List<FotoResponse> fotos;
    private Instant createdAt;
    private Instant updatedAt;
}
