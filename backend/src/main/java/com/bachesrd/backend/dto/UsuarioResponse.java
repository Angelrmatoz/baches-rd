package com.bachesrd.backend.dto;

import com.bachesrd.backend.model.Rol;
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
public class UsuarioResponse {

    private UUID id;
    private String nombre;
    private String email;
    private Rol rol;
    private String avatarUrl;
    private Boolean activo;
    private Instant createdAt;
}
