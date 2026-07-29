package com.bachesrd.backend.service;

import com.bachesrd.backend.config.JwtService;
import com.bachesrd.backend.dto.AuthResponse;
import com.bachesrd.backend.dto.LoginRequest;
import com.bachesrd.backend.dto.RegisterRequest;
import com.bachesrd.backend.dto.UsuarioResponse;
import com.bachesrd.backend.entity.Rol;
import com.bachesrd.backend.entity.Usuario;
import com.bachesrd.backend.repository.UsuarioRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.server.ResponseStatusException;

import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UsuarioServiceTest {

    @Mock
    private UsuarioRepository usuarioRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtService jwtService;

    @InjectMocks
    private UsuarioService usuarioService;

    private RegisterRequest registerRequest;
    private LoginRequest loginRequest;
    private Usuario usuarioPrueba;

    @BeforeEach
    void setUp() {
        registerRequest = RegisterRequest.builder()
                .nombre("Juan Pérez")
                .email("juan@example.com")
                .password("Password123!")
                .build();

        loginRequest = LoginRequest.builder()
                .email("juan@example.com")
                .password("Password123!")
                .build();

        usuarioPrueba = Usuario.builder()
                .id(UUID.randomUUID())
                .nombre("Juan Pérez")
                .email("juan@example.com")
                .passwordHash("$2a$10$hashPruebaBCrypt1234567890")
                .rol(Rol.CIUDADANO)
                .activo(true)
                .build();
    }

    @Test
    @DisplayName("Registrar usuario exitosamente")
    void registrarUsuario_Exitoso() {
        when(usuarioRepository.existsByEmail("juan@example.com")).thenReturn(false);
        when(passwordEncoder.encode("Password123!")).thenReturn("hashPasswordEncoded");
        when(usuarioRepository.save(any(Usuario.class))).thenReturn(usuarioPrueba);

        UsuarioResponse response = usuarioService.registrarUsuario(registerRequest);

        assertThat(response).isNotNull();
        assertThat(response.getEmail()).isEqualTo("juan@example.com");
        assertThat(response.getRol()).isEqualTo(Rol.CIUDADANO);
        verify(usuarioRepository, times(1)).save(any(Usuario.class));
    }

    @Test
    @DisplayName("Lanza 409 Conflict si el email ya está registrado")
    void registrarUsuario_EmailDuplicado_LanzaConflict() {
        when(usuarioRepository.existsByEmail("juan@example.com")).thenReturn(true);

        assertThatThrownBy(() -> usuarioService.registrarUsuario(registerRequest))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("El correo electrónico ya está registrado");

        verify(usuarioRepository, never()).save(any(Usuario.class));
    }

    @Test
    @DisplayName("Autenticar usuario exitosamente y retornar token JWT")
    void autenticarUsuario_Exitoso() {
        when(usuarioRepository.findByEmail("juan@example.com")).thenReturn(Optional.of(usuarioPrueba));
        when(passwordEncoder.matches("Password123!", usuarioPrueba.getPasswordHash())).thenReturn(true);
        when(jwtService.generateToken(usuarioPrueba.getEmail(), usuarioPrueba.getRol().name())).thenReturn("tokenJwtPrueba");

        AuthResponse authResponse = usuarioService.autenticarUsuario(loginRequest);

        assertThat(authResponse).isNotNull();
        assertThat(authResponse.getToken()).isEqualTo("tokenJwtPrueba");
        assertThat(authResponse.getUser().getEmail()).isEqualTo("juan@example.com");
    }

    @Test
    @DisplayName("Lanza 401 Unauthorized cuando la contraseña es incorrecta")
    void autenticarUsuario_PasswordIncorrecta_LanzaUnauthorized() {
        when(usuarioRepository.findByEmail("juan@example.com")).thenReturn(Optional.of(usuarioPrueba));
        when(passwordEncoder.matches("Password123!", usuarioPrueba.getPasswordHash())).thenReturn(false);

        assertThatThrownBy(() -> usuarioService.autenticarUsuario(loginRequest))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("Credenciales incorrectas");
    }

    @Test
    @DisplayName("Lanza 403 Forbidden cuando la cuenta está inactiva")
    void autenticarUsuario_CuentaInactiva_LanzaForbidden() {
        usuarioPrueba.setActivo(false);
        when(usuarioRepository.findByEmail("juan@example.com")).thenReturn(Optional.of(usuarioPrueba));
        when(passwordEncoder.matches("Password123!", usuarioPrueba.getPasswordHash())).thenReturn(true);

        assertThatThrownBy(() -> usuarioService.autenticarUsuario(loginRequest))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("La cuenta de usuario está desactivada");
    }
}
