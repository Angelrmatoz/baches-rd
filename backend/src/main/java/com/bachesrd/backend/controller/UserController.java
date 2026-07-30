package com.bachesrd.backend.controller;

import com.bachesrd.backend.dto.ReporteResponse;
import com.bachesrd.backend.dto.UpdatePerfilRequest;
import com.bachesrd.backend.dto.UsuarioResponse;
import com.bachesrd.backend.entity.Usuario;
import com.bachesrd.backend.repository.ReporteBacheRepository;
import com.bachesrd.backend.repository.UsuarioRepository;
import com.bachesrd.backend.service.ReporteService;
import com.bachesrd.backend.service.UsuarioService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
public class UserController {

    private final UsuarioRepository usuarioRepository;
    private final UsuarioService usuarioService;
    private final ReporteBacheRepository reporteRepository;
    private final ReporteService reporteService;

    private Usuario getUsuarioAutenticado(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return null;
        }
        if (authentication.getPrincipal() instanceof Usuario u) {
            return u;
        }
        return usuarioRepository.findByEmail(authentication.getName()).orElse(null);
    }

    @GetMapping("/me")
    public ResponseEntity<UsuarioResponse> obtenerPerfilActual(Authentication authentication) {
        Usuario usuario = getUsuarioAutenticado(authentication);
        if (usuario == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Usuario no autenticado");
        }
        return ResponseEntity.ok(usuarioService.mapToUsuarioResponse(usuario));
    }

    @PatchMapping("/me")
    public ResponseEntity<UsuarioResponse> actualizarPerfil(
            @Valid @RequestBody UpdatePerfilRequest request,
            Authentication authentication
    ) {
        Usuario usuario = getUsuarioAutenticado(authentication);
        if (usuario == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Usuario no autenticado");
        }
        UsuarioResponse response = usuarioService.actualizarPerfil(usuario, request);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/me/reports")
    public ResponseEntity<List<ReporteResponse>> obtenerMisReportes(Authentication authentication) {
        Usuario usuario = getUsuarioAutenticado(authentication);
        if (usuario == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Usuario no autenticado");
        }
        List<ReporteResponse> misReportes = reporteRepository.findByUsuarioIdOrderByCreatedAtDesc(usuario.getId())
                .stream()
                .map(r -> reporteService.mapToReporteResponse(r, usuario))
                .toList();
        return ResponseEntity.ok(misReportes);
    }
}
