package com.bachesrd.backend.service;

import com.bachesrd.backend.config.JwtService;
import com.bachesrd.backend.dto.AuthResponse;
import com.bachesrd.backend.dto.LoginRequest;
import com.bachesrd.backend.dto.RegisterRequest;
import com.bachesrd.backend.dto.UpdatePerfilRequest;
import com.bachesrd.backend.dto.UsuarioResponse;
import com.bachesrd.backend.entity.Rol;
import com.bachesrd.backend.entity.Usuario;
import com.bachesrd.backend.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class UsuarioService {

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final CloudinaryService cloudinaryService;

    @Transactional
    public UsuarioResponse registrarUsuario(RegisterRequest request) {
        if (usuarioRepository.existsByEmail(request.getEmail())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "El correo electrónico ya está registrado");
        }

        Usuario usuario = Usuario.builder()
                .nombre(request.getNombre().trim())
                .email(request.getEmail().toLowerCase().trim())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .rol(Rol.CIUDADANO)
                .activo(true)
                .build();

        Usuario usuarioGuardado = usuarioRepository.save(usuario);

        return mapToUsuarioResponse(usuarioGuardado);
    }

    public AuthResponse autenticarUsuario(LoginRequest request) {
        Usuario usuario = usuarioRepository.findByEmail(request.getEmail().toLowerCase().trim())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Credenciales incorrectas"));

        if (!passwordEncoder.matches(request.getPassword(), usuario.getPasswordHash())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Credenciales incorrectas");
        }

        if (!usuario.getActivo()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "La cuenta de usuario está desactivada");
        }

        String token = jwtService.generateToken(usuario.getEmail(), usuario.getRol().name());

        return AuthResponse.builder()
                .token(token)
                .user(mapToUsuarioResponse(usuario))
                .build();
    }

    @Transactional
    public UsuarioResponse actualizarPerfil(Usuario usuario, UpdatePerfilRequest request) {
        if (request.getNombre() != null && !request.getNombre().isBlank()) {
            usuario.setNombre(request.getNombre().trim());
        }
        if (request.getAvatarUrl() != null) {
            String oldUrl = usuario.getAvatarUrl();
            String newUrl = request.getAvatarUrl().trim();
            boolean changed = !newUrl.equals(oldUrl != null ? oldUrl : "");

            if (changed && oldUrl != null && !oldUrl.isBlank()) {
                String oldPublicId = cloudinaryService.extractPublicIdFromUrl(oldUrl);
                if (oldPublicId != null) {
                    cloudinaryService.eliminarImagen(oldPublicId);
                }
            }

            usuario.setAvatarUrl(newUrl.isEmpty() ? null : newUrl);
        }
        Usuario actualizado = usuarioRepository.save(usuario);
        return mapToUsuarioResponse(actualizado);
    }

    public UsuarioResponse mapToUsuarioResponse(Usuario usuario) {
        return UsuarioResponse.builder()
                .id(usuario.getId())
                .nombre(usuario.getNombre())
                .email(usuario.getEmail())
                .rol(usuario.getRol())
                .avatarUrl(usuario.getAvatarUrl())
                .activo(usuario.getActivo())
                .createdAt(usuario.getCreatedAt())
                .build();
    }
}
