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
}
