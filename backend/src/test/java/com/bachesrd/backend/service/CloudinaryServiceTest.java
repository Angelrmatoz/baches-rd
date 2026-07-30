package com.bachesrd.backend.service;

import com.bachesrd.backend.dto.CloudinarySignatureResponse;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import static org.assertj.core.api.Assertions.assertThat;

@ExtendWith(MockitoExtension.class)
class CloudinaryServiceTest {

    @InjectMocks
    private CloudinaryService cloudinaryService;

    @Test
    @DisplayName("Generar firma criptográfica SHA-1 para Cloudinary Direct Upload")
    void generateSignature_GeneraFirmaValida() {
        ReflectionTestUtils.setField(cloudinaryService, "cloudName", "baches-rd-test");
        ReflectionTestUtils.setField(cloudinaryService, "apiKey", "1234567890");
        ReflectionTestUtils.setField(cloudinaryService, "apiSecret", "secretPrueba123");

        CloudinarySignatureResponse response = cloudinaryService.generateSignature();

        assertThat(response).isNotNull();
        assertThat(response.getSignature()).isNotBlank();
        assertThat(response.getApiKey()).isEqualTo("1234567890");
        assertThat(response.getCloudName()).isEqualTo("baches-rd-test");
        assertThat(response.getTimestamp()).isGreaterThan(0);
    }

    @Test
    @DisplayName("Extraer public_id de URL con versión (vXXXX)")
    void extractPublicIdFromUrl_ConVersion_RetornaPublicId() {
        String url = "https://res.cloudinary.com/demo/image/upload/v123456/folder/avatar.jpg";
        String result = cloudinaryService.extractPublicIdFromUrl(url);
        assertThat(result).isEqualTo("folder/avatar");
    }

    @Test
    @DisplayName("Extraer public_id de URL sin versión")
    void extractPublicIdFromUrl_SinVersion_RetornaPublicId() {
        String url = "https://res.cloudinary.com/demo/image/upload/reportes/foto.jpg";
        String result = cloudinaryService.extractPublicIdFromUrl(url);
        assertThat(result).isEqualTo("reportes/foto");
    }

    @Test
    @DisplayName("Retornar null si URL es null")
    void extractPublicIdFromUrl_Null_RetornaNull() {
        assertThat(cloudinaryService.extractPublicIdFromUrl(null)).isNull();
    }

    @Test
    @DisplayName("Retornar null si URL está vacía")
    void extractPublicIdFromUrl_Vacia_RetornaNull() {
        assertThat(cloudinaryService.extractPublicIdFromUrl("")).isNull();
    }

    @Test
    @DisplayName("Retornar null si URL no contiene /upload/")
    void extractPublicIdFromUrl_SinUpload_RetornaNull() {
        String url = "https://ejemplo.com/imagen.jpg";
        assertThat(cloudinaryService.extractPublicIdFromUrl(url)).isNull();
    }

    @Test
    @DisplayName("Extraer public_id de URL con formato PNG")
    void extractPublicIdFromUrl_Png_RetornaPublicId() {
        String url = "https://res.cloudinary.com/demo/image/upload/v1/bache.png";
        String result = cloudinaryService.extractPublicIdFromUrl(url);
        assertThat(result).isEqualTo("bache");
    }
}
