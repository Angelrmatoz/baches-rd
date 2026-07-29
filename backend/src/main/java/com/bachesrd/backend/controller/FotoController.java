package com.bachesrd.backend.controller;

import com.bachesrd.backend.dto.CloudinarySignatureResponse;
import com.bachesrd.backend.dto.FotoRequest;
import com.bachesrd.backend.dto.FotoResponse;
import com.bachesrd.backend.entity.Usuario;
import com.bachesrd.backend.repository.UsuarioRepository;
import com.bachesrd.backend.service.CloudinaryService;
import com.bachesrd.backend.service.ReporteService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class FotoController {

    private final CloudinaryService cloudinaryService;
    private final ReporteService reporteService;
    private final UsuarioRepository usuarioRepository;

    private Usuario getUsuarioAutenticado(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return null;
        }
        return usuarioRepository.findByEmail(authentication.getName()).orElse(null);
    }

    @GetMapping("/photos/signature")
    public ResponseEntity<CloudinarySignatureResponse> obtenerFirmaCloudinary() {
        CloudinarySignatureResponse signature = cloudinaryService.generateSignature();
        return ResponseEntity.ok(signature);
    }

    @PostMapping("/reports/{id}/photos")
    public ResponseEntity<FotoResponse> agregarFoto(
            @PathVariable UUID id,
            @Valid @RequestBody FotoRequest request,
            Authentication authentication
    ) {
        Usuario usuario = getUsuarioAutenticado(authentication);
        if (usuario == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Usuario no autenticado");
        }
        FotoResponse response = reporteService.agregarFoto(id, request, usuario);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @DeleteMapping("/reports/{id}/photos/{photoId}")
    public ResponseEntity<Void> eliminarFoto(
            @PathVariable UUID id,
            @PathVariable UUID photoId,
            Authentication authentication
    ) {
        Usuario usuario = getUsuarioAutenticado(authentication);
        if (usuario == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Usuario no autenticado");
        }
        reporteService.eliminarFoto(id, photoId, usuario);
        return ResponseEntity.noContent().build();
    }
}
