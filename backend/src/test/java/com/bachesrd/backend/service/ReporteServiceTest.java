package com.bachesrd.backend.service;

import com.bachesrd.backend.dto.ReporteRequest;
import com.bachesrd.backend.dto.ReporteResponse;
import com.bachesrd.backend.entity.EstadoReporte;
import com.bachesrd.backend.entity.ReporteBache;
import com.bachesrd.backend.entity.Rol;
import com.bachesrd.backend.entity.Severidad;
import com.bachesrd.backend.entity.Usuario;
import com.bachesrd.backend.exception.DuplicateReportException;
import com.bachesrd.backend.repository.FotoReporteRepository;
import com.bachesrd.backend.repository.ReporteBacheRepository;
import com.bachesrd.backend.repository.ValidacionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.locationtech.jts.geom.Coordinate;
import org.locationtech.jts.geom.GeometryFactory;
import org.locationtech.jts.geom.Point;
import org.locationtech.jts.geom.PrecisionModel;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyDouble;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ReporteServiceTest {

    @Mock
    private ReporteBacheRepository reporteRepository;

    @Mock
    private FotoReporteRepository fotoRepository;

    @Mock
    private ValidacionRepository validacionRepository;

    @Mock
    private CloudinaryService cloudinaryService;

    @InjectMocks
    private ReporteService reporteService;

    private GeometryFactory geometryFactory = new GeometryFactory(new PrecisionModel(), 4326);
    private Usuario usuarioCreador;
    private Usuario usuarioOtro;
    private ReporteRequest reporteRequest;
    private ReporteBache bacheGuardado;
    private UUID bacheId;

    @BeforeEach
    void setUp() {
        bacheId = UUID.randomUUID();

        usuarioCreador = Usuario.builder()
                .id(UUID.randomUUID())
                .nombre("Ciudadano Creador")
                .email("creador@example.com")
                .rol(Rol.CIUDADANO)
                .build();

        usuarioOtro = Usuario.builder()
                .id(UUID.randomUUID())
                .nombre("Otro Ciudadano")
                .email("otro@example.com")
                .rol(Rol.CIUDADANO)
                .build();

        reporteRequest = ReporteRequest.builder()
                .latitud(new BigDecimal("18.4860575"))
                .longitud(new BigDecimal("-69.9312117"))
                .descripcion("Bache profundo cerca de la avenida Lope de Vega")
                .severidad(Severidad.GRAVE)
                .build();

        Point punto = geometryFactory.createPoint(new Coordinate(-69.9312117, 18.4860575));

        bacheGuardado = ReporteBache.builder()
                .id(bacheId)
                .usuario(usuarioCreador)
                .descripcion(reporteRequest.getDescripcion())
                .coordenadas(punto)
                .latitud(reporteRequest.getLatitud())
                .longitud(reporteRequest.getLongitud())
                .severidad(Severidad.GRAVE)
                .estado(EstadoReporte.ACTIVO)
                .totalValidaciones(0)
                .build();
    }

    @Test
    @DisplayName("Crear reporte de bache exitosamente")
    void crearReporte_Exitoso() {
        when(reporteRepository.findNearbyDuplicates(anyDouble(), anyDouble(), eq(30.0)))
                .thenReturn(Collections.emptyList());
        when(reporteRepository.save(any(ReporteBache.class))).thenReturn(bacheGuardado);

        ReporteResponse response = reporteService.crearReporte(reporteRequest, usuarioCreador);

        assertThat(response).isNotNull();
        assertThat(response.getId()).isEqualTo(bacheId);
        assertThat(response.getSeveridad()).isEqualTo(Severidad.GRAVE);
        verify(reporteRepository, times(1)).save(any(ReporteBache.class));
    }

    @Test
    @DisplayName("Lanza DuplicateReportException si existe un bache a menos de 30 metros")
    void crearReporte_BacheColisionCercana_LanzaDuplicateReportException() {
        when(reporteRepository.findNearbyDuplicates(anyDouble(), anyDouble(), eq(30.0)))
                .thenReturn(List.of(bacheGuardado));

        assertThatThrownBy(() -> reporteService.crearReporte(reporteRequest, usuarioCreador))
                .isInstanceOf(DuplicateReportException.class)
                .hasMessageContaining("Ya existe un reporte activo en esta ubicación");

        verify(reporteRepository, never()).save(any(ReporteBache.class));
    }

    @Test
    @DisplayName("Lanza 403 Forbidden cuando un usuario no creador intenta eliminar el reporte")
    void eliminarReporte_UsuarioSinPermisos_LanzaForbidden() {
        when(reporteRepository.findById(bacheId)).thenReturn(Optional.of(bacheGuardado));

        assertThatThrownBy(() -> reporteService.eliminarReporte(bacheId, usuarioOtro))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("No tienes permisos para eliminar este reporte");

        verify(reporteRepository, never()).delete(any(ReporteBache.class));
    }

    @Test
    @DisplayName("Permite cambiar el estado del bache a un Administrador")
    void cambiarEstado_AdminExitoso() {
        Usuario admin = Usuario.builder().id(UUID.randomUUID()).rol(Rol.ADMIN).build();
        when(reporteRepository.findById(bacheId)).thenReturn(Optional.of(bacheGuardado));
        when(reporteRepository.save(any(ReporteBache.class))).thenReturn(bacheGuardado);

        ReporteResponse response = reporteService.cambiarEstado(bacheId, EstadoReporte.RESUELTO, admin);

        assertThat(response).isNotNull();
        verify(reporteRepository, times(1)).save(bacheGuardado);
    }

    @Test
    @DisplayName("Obtener reportes filtrados por bounding box exitosamente")
    void obtenerReportes_BoundingBox_Exitoso() {
        when(reporteRepository.findInBoundingBox(18.4, -69.95, 18.5, -69.9, null, null))
                .thenReturn(List.of(bacheGuardado));

        org.springframework.data.domain.Page<ReporteResponse> page = reporteService.obtenerReportes(
                18.4, 18.5, -69.95, -69.9,
                null, null,
                org.springframework.data.domain.PageRequest.of(0, 10),
                usuarioCreador
        );

        assertThat(page).isNotNull();
        assertThat(page.getContent()).hasSize(1);
        assertThat(page.getContent().get(0).getId()).isEqualTo(bacheId);
    }
}
