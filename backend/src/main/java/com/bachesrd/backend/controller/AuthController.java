package com.bachesrd.backend.controller;

import com.bachesrd.backend.dto.AuthResponse;
import com.bachesrd.backend.dto.LoginRequest;
import com.bachesrd.backend.dto.RegisterRequest;
import com.bachesrd.backend.dto.UsuarioResponse;
import com.bachesrd.backend.service.UsuarioService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final UsuarioService usuarioService;

    @PostMapping("/register")
    public ResponseEntity<UsuarioResponse> register(@Valid @RequestBody RegisterRequest request) {
        UsuarioResponse response = usuarioService.registrarUsuario(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        AuthResponse response = usuarioService.autenticarUsuario(request);
        return ResponseEntity.ok(response);
    }
}
