package com.bachesrd.backend.repository;

import com.bachesrd.backend.entity.Validacion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ValidacionRepository extends JpaRepository<Validacion, UUID> {

    boolean existsByReporteIdAndUsuarioId(UUID reporteId, UUID usuarioId);

    Optional<Validacion> findByReporteIdAndUsuarioId(UUID reporteId, UUID usuarioId);

    List<Validacion> findByReporteIdOrderByCreatedAtDesc(UUID reporteId);
}
