package com.bachesrd.backend.repository;

import com.bachesrd.backend.entity.FotoReporte;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface FotoReporteRepository extends JpaRepository<FotoReporte, UUID> {

    List<FotoReporte> findByReporteIdOrderByCreatedAtAsc(UUID reporteId);

    long countByReporteId(UUID reporteId);
}
