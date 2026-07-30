package com.bachesrd.backend.security;

import com.bachesrd.backend.config.JwtService;
import com.bachesrd.backend.dto.UpdateStatusRequest;
import com.bachesrd.backend.entity.EstadoReporte;
import com.bachesrd.backend.entity.Rol;
import com.bachesrd.backend.entity.Usuario;
import com.bachesrd.backend.repository.UsuarioRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

import java.util.UUID;

import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(properties = {
    "JWT_SECRET=074142544c0e3e63e4c3c1ae7b76bd8852a40e3d3a45665b9393b59f85f6881e",
    "JWT_EXPIRATION=86400000",
    "CLOUDINARY_CLOUD_NAME=baches-rd",
    "CLOUDINARY_API_KEY=1234567890",
    "CLOUDINARY_API_SECRET=secret_cloudinary_key_baches"
})
@ActiveProfiles("dev")
class SecurityIntegrationTest {

    private MockMvc mockMvc;

    @Autowired
    private WebApplicationContext context;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private UsuarioRepository usuarioRepository;

    private final ObjectMapper objectMapper = new ObjectMapper();
    private String ciudadanoToken;
    private Usuario ciudadano;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders
                .webAppContextSetup(context)
                .apply(springSecurity())
                .build();

        usuarioRepository.deleteAll();

        ciudadano = Usuario.builder()
                .nombre("Ciudadano Test")
                .email("ciudadano.sec@example.com")
                .passwordHash("$2a$10$hashPruebaBCrypt1234567890")
                .rol(Rol.CIUDADANO)
                .activo(true)
                .build();

        usuarioRepository.save(ciudadano);
        ciudadanoToken = jwtService.generateToken(ciudadano.getEmail(), ciudadano.getRol().name());
    }

    @Test
    @DisplayName("Ciberseguridad: Rechazar acceso a /users/me sin token JWT (401 Unauthorized)")
    void accesoSinToken_Retorna401() throws Exception {
        mockMvc.perform(get("/api/v1/users/me"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("Ciberseguridad: Rechazar token JWT alterado/manipulado (401 Unauthorized)")
    void tokenManipulado_Retorna401() throws Exception {
        String tokenInvalido = ciudadanoToken + "FirmaAlteradaCiberseguridad";

        mockMvc.perform(get("/api/v1/users/me")
                        .header("Authorization", "Bearer " + tokenInvalido))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("Ciberseguridad: Bloquear cambio de estado a usuario con rol CIUDADANO (403 Forbidden)")
    void usuarioCiudadanoCambiarEstado_Retorna403() throws Exception {
        UUID reporteId = UUID.randomUUID();
        UpdateStatusRequest request = UpdateStatusRequest.builder().estado(EstadoReporte.RESUELTO).build();

        mockMvc.perform(patch("/api/v1/reports/" + reporteId + "/status")
                        .header("Authorization", "Bearer " + ciudadanoToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Permitir lectura pública de baches cercanos en el mapa sin token (200 OK)")
    void lecturaPublicaMapa_Retorna200() throws Exception {
        mockMvc.perform(get("/api/v1/reports/nearby")
                        .param("latitud", "18.4860575")
                        .param("longitud", "-69.9312117"))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("Permitir actualización de perfil PATCH /users/me con token válido (200 OK)")
    void actualizarPerfil_ConToken_Retorna200() throws Exception {
        com.bachesrd.backend.dto.UpdatePerfilRequest req = com.bachesrd.backend.dto.UpdatePerfilRequest.builder()
                .nombre("Nuevo Nombre Test")
                .build();

        mockMvc.perform(patch("/api/v1/users/me")
                        .header("Authorization", "Bearer " + ciudadanoToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk());
    }
}
