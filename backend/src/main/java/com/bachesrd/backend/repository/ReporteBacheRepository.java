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

    @Query(value = """
        SELECT * FROM reportes_baches r
        WHERE ST_Within(
            r.coordenadas,
            ST_MakeEnvelope(:minLon, :minLat, :maxLon, :maxLat, 4326)
        )
        AND (:estado IS NULL OR r.estado = :estado)
        AND (:severidad IS NULL OR r.severidad = :severidad)
        ORDER BY r.created_at DESC
        """, nativeQuery = true)
    List<ReporteBache> findInBoundingBox(
            @Param("minLat") double minLat,
            @Param("minLon") double minLon,
            @Param("maxLat") double maxLat,
            @Param("maxLon") double maxLon,
            @Param("estado") String estado,
            @Param("severidad") String severidad
    );

    @Query(value = """
        SELECT r FROM ReporteBache r
        WHERE (:estado IS NULL OR r.estado = :estado)
        AND (:severidad IS NULL OR r.severidad = :severidad)
        ORDER BY r.createdAt DESC
        """)
    org.springframework.data.domain.Page<ReporteBache> findFiltered(
            @Param("estado") EstadoReporte estado,
            @Param("severidad") com.bachesrd.backend.entity.Severidad severidad,
            org.springframework.data.domain.Pageable pageable
    );
}
