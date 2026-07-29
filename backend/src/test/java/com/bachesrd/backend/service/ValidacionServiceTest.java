package com.bachesrd.backend.service;

import com.bachesrd.backend.entity.ReporteBache;
import com.bachesrd.backend.entity.Usuario;
import com.bachesrd.backend.entity.Validacion;
import com.bachesrd.backend.repository.ReporteBacheRepository;
import com.bachesrd.backend.repository.ValidacionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ValidacionServiceTest {

    @Mock
    private ValidacionRepository validacionRepository;

    @Mock
    private ReporteBacheRepository reporteRepository;

    @InjectMocks
    private ValidacionService validacionService;

    private Usuario usuario;
    private ReporteBache reporte;
    private UUID reporteId;

    @BeforeEach
    void setUp() {
        reporteId = UUID.randomUUID();
        usuario = Usuario.builder().id(UUID.randomUUID()).nombre("Validador").build();
        reporte = ReporteBache.builder().id(reporteId).totalValidaciones(5).build();
    }

    @Test
    @DisplayName("Agregar validación incrementa el contador de validaciones")
    void agregarValidacion_IncrementaContador() {
        when(reporteRepository.findById(reporteId)).thenReturn(Optional.of(reporte));
        when(validacionRepository.existsByReporteIdAndUsuarioId(reporteId, usuario.getId())).thenReturn(false);

        Integer total = validacionService.agregarValidacion(reporteId, usuario);

        assertThat(total).isEqualTo(6);
        verify(validacionRepository, times(1)).save(any(Validacion.class));
        verify(reporteRepository, times(1)).save(reporte);
    }

    @Test
    @DisplayName("Mantiene el contador si el usuario ya había validado previamente")
    void agregarValidacion_YaExiste_MantieneContador() {
        when(reporteRepository.findById(reporteId)).thenReturn(Optional.of(reporte));
        when(validacionRepository.existsByReporteIdAndUsuarioId(reporteId, usuario.getId())).thenReturn(true);

        Integer total = validacionService.agregarValidacion(reporteId, usuario);

        assertThat(total).isEqualTo(5);
        verify(validacionRepository, never()).save(any(Validacion.class));
    }

    @Test
    @DisplayName("Eliminar validación decrementa el contador de validaciones")
    void eliminarValidacion_DecrementaContador() {
        Validacion validacion = Validacion.builder().id(UUID.randomUUID()).reporte(reporte).usuario(usuario).build();
        when(reporteRepository.findById(reporteId)).thenReturn(Optional.of(reporte));
        when(validacionRepository.findByReporteIdAndUsuarioId(reporteId, usuario.getId())).thenReturn(Optional.of(validacion));

        Integer total = validacionService.eliminarValidacion(reporteId, usuario);

        assertThat(total).isEqualTo(4);
        verify(validacionRepository, times(1)).delete(validacion);
        verify(reporteRepository, times(1)).save(reporte);
    }
}
