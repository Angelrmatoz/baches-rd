package com.bachesrd.backend.repository;

import com.bachesrd.backend.entity.EstadoReporte;
import com.bachesrd.backend.entity.ReporteBache;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Repository
public interface ReporteBacheRepository extends JpaRepository<ReporteBache, UUID> {

    @Query(value = """
        SELECT * FROM reportes_baches r
        WHERE ST_DWithin(
            r.coordenadas::geography,
            ST_SetSRID(ST_MakePoint(:longitud, :latitud), 4326)::geography,
            :radioMetros
        )
        AND r.estado != 'RESUELTO'
        ORDER BY r.created_at DESC
        LIMIT 5
        """, nativeQuery = true)
    List<ReporteBache> findNearbyDuplicates(
            @Param("latitud") double latitud,
            @Param("longitud") double longitud,
            @Param("radioMetros") double radioMetros
    );

    @Query(value = """
        SELECT * FROM reportes_baches r
        WHERE ST_DWithin(
            r.coordenadas::geography,
            ST_SetSRID(ST_MakePoint(:longitud, :latitud), 4326)::geography,
            :radioMetros
        )
        ORDER BY ST_Distance(r.coordenadas::geography, ST_SetSRID(ST_MakePoint(:longitud, :latitud), 4326)::geography) ASC
        """, nativeQuery = true)
    List<ReporteBache> findNearbyReports(
            @Param("latitud") double latitud,
            @Param("longitud") double longitud,
            @Param("radioMetros") double radioMetros
    );

    List<ReporteBache> findByUsuarioIdOrderByCreatedAtDesc(UUID usuarioId);
}
