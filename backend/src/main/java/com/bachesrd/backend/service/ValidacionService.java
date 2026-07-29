package com.bachesrd.backend.service;

import com.bachesrd.backend.dto.UsuarioResponse;
import com.bachesrd.backend.entity.ReporteBache;
import com.bachesrd.backend.entity.Usuario;
import com.bachesrd.backend.entity.Validacion;
import com.bachesrd.backend.repository.ReporteBacheRepository;
import com.bachesrd.backend.repository.ValidacionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ValidacionService {

    private final ValidacionRepository validacionRepository;
    private final ReporteBacheRepository reporteRepository;

    @Transactional
    public Integer agregarValidacion(UUID reporteId, Usuario usuario) {
        ReporteBache reporte = reporteRepository.findById(reporteId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Reporte no encontrado"));

        if (validacionRepository.existsByReporteIdAndUsuarioId(reporteId, usuario.getId())) {
            return reporte.getTotalValidaciones();
        }

        Validacion validacion = Validacion.builder()
                .reporte(reporte)
                .usuario(usuario)
                .build();

        validacionRepository.save(validacion);

        reporte.setTotalValidaciones(reporte.getTotalValidaciones() + 1);
        reporteRepository.save(reporte);

        return reporte.getTotalValidaciones();
    }

    @Transactional
    public Integer eliminarValidacion(UUID reporteId, Usuario usuario) {
        ReporteBache reporte = reporteRepository.findById(reporteId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Reporte no encontrado"));

        Optional<Validacion> optValidacion = validacionRepository.findByReporteIdAndUsuarioId(reporteId, usuario.getId());
        if (optValidacion.isPresent()) {
            validacionRepository.delete(optValidacion.get());

            int nuevoTotal = Math.max(0, reporte.getTotalValidaciones() - 1);
            reporte.setTotalValidaciones(nuevoTotal);
            reporteRepository.save(reporte);
        }

        return reporte.getTotalValidaciones();
    }

    @Transactional(readOnly = true)
    public List<UsuarioResponse> obtenerValidadores(UUID reporteId) {
        if (!reporteRepository.existsById(reporteId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Reporte no encontrado");
        }

        return validacionRepository.findByReporteIdOrderByCreatedAtDesc(reporteId)
                .stream()
                .map(v -> UsuarioResponse.builder()
                        .id(v.getUsuario().getId())
                        .nombre(v.getUsuario().getNombre())
                        .email(v.getUsuario().getEmail())
                        .rol(v.getUsuario().getRol())
                        .avatarUrl(v.getUsuario().getAvatarUrl())
                        .activo(v.getUsuario().getActivo())
                        .createdAt(v.getUsuario().getCreatedAt())
                        .build())
                .toList();
    }
}
