package com.bachesrd.backend.service;

import com.bachesrd.backend.dto.*;
import com.bachesrd.backend.entity.*;
import com.bachesrd.backend.exception.DuplicateReportException;
import com.bachesrd.backend.repository.FotoReporteRepository;
import com.bachesrd.backend.repository.ReporteBacheRepository;
import com.bachesrd.backend.repository.ValidacionRepository;
import lombok.RequiredArgsConstructor;
import org.locationtech.jts.geom.Coordinate;
import org.locationtech.jts.geom.GeometryFactory;
import org.locationtech.jts.geom.Point;
import org.locationtech.jts.geom.PrecisionModel;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.List;
import java.util.Objects;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ReporteService {

    private final ReporteBacheRepository reporteRepository;
    private final FotoReporteRepository fotoRepository;
    private final ValidacionRepository validacionRepository;
    private final CloudinaryService cloudinaryService;
    private final GeometryFactory geometryFactory = new GeometryFactory(new PrecisionModel(), 4326);

    @Transactional
    public ReporteResponse crearReporte(ReporteRequest request, Usuario usuario) {
        double lat = request.getLatitud().doubleValue();
        double lon = request.getLongitud().doubleValue();

        List<ReporteBache> duplicados = reporteRepository.findNearbyDuplicates(lat, lon, 30.0);
        if (!duplicados.isEmpty()) {
            ReporteBache existente = duplicados.get(0);
            throw new DuplicateReportException(
                    "Ya existe un reporte activo en esta ubicación.",
                    existente.getId()
            );
        }

        Point puntoGps = geometryFactory.createPoint(new Coordinate(lon, lat));

        ReporteBache reporte = ReporteBache.builder()
                .usuario(usuario)
                .descripcion(request.getDescripcion())
                .coordenadas(puntoGps)
                .latitud(request.getLatitud())
                .longitud(request.getLongitud())
                .direccionAprox(request.getDireccionAprox())
                .severidad(request.getSeveridad() != null ? request.getSeveridad() : Severidad.MEDIA)
                .estado(EstadoReporte.ACTIVO)
                .totalValidaciones(0)
                .build();

        ReporteBache guardado = reporteRepository.save(reporte);
        return mapToReporteResponse(guardado, usuario);
    }

    @Transactional(readOnly = true)
    public List<ReporteResponse> obtenerReportesCercanos(double latitud, double longitud, double radioMetros, Usuario usuarioActual) {
        double radio = radioMetros > 0 ? radioMetros : 5000.0;
        List<ReporteBache> reportes = reporteRepository.findNearbyReports(latitud, longitud, radio);
        return reportes.stream()
                .map(r -> mapToReporteResponse(r, usuarioActual))
                .toList();
    }

    @Transactional(readOnly = true)
    public org.springframework.data.domain.Page<ReporteResponse> obtenerReportes(
            Double minLat, Double maxLat, Double minLon, Double maxLon,
            EstadoReporte estado, Severidad severidad,
            org.springframework.data.domain.Pageable pageable,
            Usuario usuarioActual
    ) {
        if (minLat != null && maxLat != null && minLon != null && maxLon != null) {
            String estadoStr = estado != null ? estado.name() : null;
            String severidadStr = severidad != null ? severidad.name() : null;
            List<ReporteBache> list = reporteRepository.findInBoundingBox(minLat, minLon, maxLat, maxLon, estadoStr, severidadStr);
            List<ReporteResponse> content = list.stream().map(r -> mapToReporteResponse(r, usuarioActual)).toList();
            return new org.springframework.data.domain.PageImpl<>(content, pageable, content.size());
        }
        org.springframework.data.domain.Page<ReporteBache> page = reporteRepository.findFiltered(estado, severidad, pageable);
        return page.map(r -> mapToReporteResponse(r, usuarioActual));
    }

    @Transactional(readOnly = true)
    public ReporteResponse obtenerPorId(UUID id, Usuario usuarioActual) {
        ReporteBache reporte = reporteRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Reporte no encontrado"));
        return mapToReporteResponse(reporte, usuarioActual);
    }

    @Transactional
    public ReporteResponse cambiarEstado(UUID id, EstadoReporte nuevoEstado, Usuario usuarioActual) {
        ReporteBache reporte = reporteRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Reporte no encontrado"));

        reporte.setEstado(nuevoEstado);
        reporte.setUpdatedAt(Instant.now());
        ReporteBache actualizado = reporteRepository.save(reporte);
        return mapToReporteResponse(actualizado, usuarioActual);
    }

    @Transactional
    public ReporteResponse actualizarReporte(UUID id, UpdateReporteRequest request, Usuario usuarioActual) {
        ReporteBache reporte = reporteRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Reporte no encontrado"));

        if (!usuarioActual.getRol().equals(Rol.ADMIN) && !reporte.getUsuario().getId().equals(usuarioActual.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "No tienes permisos para editar este reporte");
        }

        if (request.getDescripcion() != null) {
            reporte.setDescripcion(request.getDescripcion().trim());
        }
        if (request.getDireccionAprox() != null) {
            reporte.setDireccionAprox(request.getDireccionAprox().trim());
        }
        if (request.getSeveridad() != null) {
            reporte.setSeveridad(request.getSeveridad());
        }

        reporte.setUpdatedAt(Instant.now());
        ReporteBache actualizado = reporteRepository.save(reporte);
        return mapToReporteResponse(actualizado, usuarioActual);
    }

    @Transactional
    public void eliminarReporte(UUID id, Usuario usuarioActual) {
        ReporteBache reporte = reporteRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Reporte no encontrado"));

        if (!usuarioActual.getRol().equals(Rol.ADMIN) && !reporte.getUsuario().getId().equals(usuarioActual.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "No tienes permisos para eliminar este reporte");
        }

        List<FotoReporte> fotos = fotoRepository.findByReporteIdOrderByCreatedAtAsc(id);
        for (FotoReporte f : fotos) {
            if (f.getCloudinaryPublicId() != null) {
                cloudinaryService.eliminarImagen(f.getCloudinaryPublicId());
            }
        }

        reporteRepository.delete(reporte);
    }

    @Transactional
    public FotoResponse agregarFoto(UUID reporteId, FotoRequest fotoRequest, Usuario usuarioActual) {
        ReporteBache reporte = reporteRepository.findById(reporteId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Reporte no encontrado"));

        if (!usuarioActual.getRol().equals(Rol.ADMIN) && !reporte.getUsuario().getId().equals(usuarioActual.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "No tienes permisos para agregar fotos a este reporte");
        }

        long totalFotos = fotoRepository.countByReporteId(reporteId);
        if (totalFotos >= 3) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Máximo 3 fotos por reporte");
        }

        FotoReporte foto = FotoReporte.builder()
                .reporte(reporte)
                .cloudinaryUrl(fotoRequest.getCloudinaryUrl())
                .cloudinaryPublicId(fotoRequest.getCloudinaryPublicId())
                .esFotoPrincipal(fotoRequest.getEsFotoPrincipal() != null ? fotoRequest.getEsFotoPrincipal() : false)
                .build();

        FotoReporte guardada = fotoRepository.save(foto);
        return mapToFotoResponse(guardada);
    }

    @Transactional
    public void eliminarFoto(UUID reporteId, UUID fotoId, Usuario usuarioActual) {
        FotoReporte foto = fotoRepository.findById(fotoId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Foto no encontrada"));

        if (!foto.getReporte().getId().equals(reporteId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La foto no pertenece al reporte especificado");
        }

        if (!usuarioActual.getRol().equals(Rol.ADMIN) && !foto.getReporte().getUsuario().getId().equals(usuarioActual.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "No tienes permisos para eliminar esta foto");
        }

        if (foto.getCloudinaryPublicId() != null) {
            cloudinaryService.eliminarImagen(foto.getCloudinaryPublicId());
        }

        fotoRepository.delete(foto);
    }

    public ReporteResponse mapToReporteResponse(ReporteBache reporte, Usuario usuarioActual) {
        boolean validado = usuarioActual != null && validacionRepository.existsByReporteIdAndUsuarioId(reporte.getId(), usuarioActual.getId());
        List<FotoResponse> fotos = fotoRepository.findByReporteIdOrderByCreatedAtAsc(reporte.getId())
                .stream()
                .map(this::mapToFotoResponse)
                .toList();

        UsuarioResponse usuarioResp = reporte.getUsuario() != null ? UsuarioResponse.builder()
                .id(reporte.getUsuario().getId())
                .nombre(reporte.getUsuario().getNombre())
                .email(reporte.getUsuario().getEmail())
                .rol(reporte.getUsuario().getRol())
                .avatarUrl(reporte.getUsuario().getAvatarUrl())
                .activo(reporte.getUsuario().getActivo())
                .createdAt(reporte.getUsuario().getCreatedAt())
                .build() : null;

        return ReporteResponse.builder()
                .id(reporte.getId())
                .usuario(usuarioResp)
                .descripcion(reporte.getDescripcion())
                .latitud(reporte.getLatitud())
                .longitud(reporte.getLongitud())
                .direccionAprox(reporte.getDireccionAprox())
                .severidad(reporte.getSeveridad())
                .estado(reporte.getEstado())
                .totalValidaciones(reporte.getTotalValidaciones())
                .validadoPorUsuarioActual(validado)
                .fotos(fotos)
                .createdAt(reporte.getCreatedAt())
                .updatedAt(reporte.getUpdatedAt())
                .build();
    }

    private FotoResponse mapToFotoResponse(FotoReporte foto) {
        return FotoResponse.builder()
                .id(foto.getId())
                .cloudinaryUrl(foto.getCloudinaryUrl())
                .cloudinaryPublicId(foto.getCloudinaryPublicId())
                .esFotoPrincipal(foto.getEsFotoPrincipal())
                .createdAt(foto.getCreatedAt())
                .build();
    }
}
