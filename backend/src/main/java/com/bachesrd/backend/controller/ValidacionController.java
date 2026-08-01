package com.bachesrd.backend.controller;

import com.bachesrd.backend.dto.UsuarioResponse;
import com.bachesrd.backend.entity.Usuario;
import com.bachesrd.backend.repository.UsuarioRepository;
import com.bachesrd.backend.service.ValidacionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/reports/{id}")
@RequiredArgsConstructor
public class ValidacionController {

    private final ValidacionService validacionService;
    private final UsuarioRepository usuarioRepository;

    private Usuario getUsuarioAutenticado(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return null;
        }
        return usuarioRepository.findByEmail(authentication.getName()).orElse(null);
    }

    @PostMapping("/validate")
    public ResponseEntity<Map<String, Object>> agregarValidacion(
            @PathVariable UUID id,
            Authentication authentication
    ) {
        Usuario usuario = getUsuarioAutenticado(authentication);
        if (usuario == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Usuario no autenticado");
        }
        Integer totalValidaciones = validacionService.agregarValidacion(id, usuario);
        return ResponseEntity.ok(Map.of(
                "message", "Validación agregada exitosamente",
                "totalValidaciones", totalValidaciones
        ));
    }

    @DeleteMapping("/validate")
    public ResponseEntity<Map<String, Object>> eliminarValidacion(
            @PathVariable UUID id,
            Authentication authentication
    ) {
        Usuario usuario = getUsuarioAutenticado(authentication);
        if (usuario == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Usuario no autenticado");
        }
        Integer totalValidaciones = validacionService.eliminarValidacion(id, usuario);
        return ResponseEntity.ok(Map.of(
                "message", "Validación removida exitosamente",
                "totalValidaciones", totalValidaciones
        ));
    }

    @GetMapping("/validators")
    public ResponseEntity<List<UsuarioResponse>> obtenerValidadores(@PathVariable UUID id) {
        List<UsuarioResponse> validadores = validacionService.obtenerValidadores(id);
        return ResponseEntity.ok(validadores);
    }
}
