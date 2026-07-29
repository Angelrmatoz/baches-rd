package com.bachesrd.backend.controller;

import com.bachesrd.backend.dto.ReporteRequest;
import com.bachesrd.backend.dto.ReporteResponse;
import com.bachesrd.backend.dto.UpdateStatusRequest;
import com.bachesrd.backend.entity.Rol;
import com.bachesrd.backend.entity.Usuario;
import com.bachesrd.backend.repository.UsuarioRepository;
import com.bachesrd.backend.service.ReporteService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/reports")
@RequiredArgsConstructor
public class ReporteController {

    private final ReporteService reporteService;
    private final UsuarioRepository usuarioRepository;

    private Usuario getUsuarioAutenticado(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return null;
        }
        return usuarioRepository.findByEmail(authentication.getName()).orElse(null);
    }

    @PostMapping
    public ResponseEntity<ReporteResponse> crearReporte(
            @Valid @RequestBody ReporteRequest request,
            Authentication authentication
    ) {
        Usuario usuario = getUsuarioAutenticado(authentication);
        if (usuario == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Usuario no autenticado");
        }
        ReporteResponse response = reporteService.crearReporte(request, usuario);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/nearby")
    public ResponseEntity<List<ReporteResponse>> obtenerCercanos(
            @RequestParam double latitud,
            @RequestParam double longitud,
            @RequestParam(defaultValue = "5000") double radio,
            Authentication authentication
    ) {
        Usuario usuario = getUsuarioAutenticado(authentication);
        List<ReporteResponse> reportes = reporteService.obtenerReportesCercanos(latitud, longitud, radio, usuario);
        return ResponseEntity.ok(reportes);
    }

    @GetMapping("/{id}")
    public ResponseEntity<ReporteResponse> obtenerPorId(
            @PathVariable UUID id,
            Authentication authentication
    ) {
        Usuario usuario = getUsuarioAutenticado(authentication);
        ReporteResponse response = reporteService.obtenerPorId(id, usuario);
        return ResponseEntity.ok(response);
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<ReporteResponse> cambiarEstado(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateStatusRequest request,
            Authentication authentication
    ) {
        Usuario usuario = getUsuarioAutenticado(authentication);
        if (usuario == null || !usuario.getRol().equals(Rol.ADMIN)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Se requieren permisos de administrador");
        }
        ReporteResponse response = reporteService.cambiarEstado(id, request.getEstado(), usuario);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminarReporte(
            @PathVariable UUID id,
            Authentication authentication
    ) {
        Usuario usuario = getUsuarioAutenticado(authentication);
        if (usuario == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Usuario no autenticado");
        }
        reporteService.eliminarReporte(id, usuario);
        return ResponseEntity.noContent().build();
    }
}
