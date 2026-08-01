package com.bachesrd.backend.service;

import com.bachesrd.backend.dto.CloudinarySignatureResponse;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CloudinaryServiceTest {

    @InjectMocks
    private CloudinaryService cloudinaryService;

    @Mock
    private HttpClient httpClient;

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

    @Test
    @DisplayName("No enviar request a Cloudinary si public_id es null o vacío")
    void eliminarImagen_NullOBlank_NoLlamaHttp() throws Exception {
        cloudinaryService.eliminarImagen(null);
        cloudinaryService.eliminarImagen("   ");

        verify(httpClient, never()).send(any(), any());
    }

    @Test
    @DisplayName("Enviar destroy a Cloudinary con firma y public_id correctos")
    void eliminarImagen_Exitoso_EnviaDestroyCorrecto() throws Exception {
        ReflectionTestUtils.setField(cloudinaryService, "cloudName", "baches-rd-test");
        ReflectionTestUtils.setField(cloudinaryService, "apiKey", "1234567890");
        ReflectionTestUtils.setField(cloudinaryService, "apiSecret", "secretPrueba123");

        HttpResponse<String> resp = mock(HttpResponse.class);
        when(resp.statusCode()).thenReturn(200);
        when(resp.body()).thenReturn("{\"result\":\"ok\"}");
        when(httpClient.send(any(HttpRequest.class), any(HttpResponse.BodyHandler.class))).thenReturn(resp);

        cloudinaryService.eliminarImagen("reportes/foto");

        ArgumentCaptor<HttpRequest> captor = ArgumentCaptor.forClass(HttpRequest.class);
        verify(httpClient, times(1)).send(captor.capture(), any(HttpResponse.BodyHandler.class));

        HttpRequest req = captor.getValue();
        assertThat(req.method()).isEqualTo("POST");
        assertThat(req.uri().toString()).isEqualTo("https://api.cloudinary.com/v1_1/baches-rd-test/image/destroy");
        assertThat(req.headers().firstValue("Content-Type")).hasValue("application/x-www-form-urlencoded");

        String body = readBody(req);
        assertThat(body).contains("public_id=reportes%2Ffoto");
        assertThat(body).contains("api_key=1234567890");
        assertThat(body).contains("signature=");
        assertThat(body).contains("timestamp=");
    }

    @Test
    @DisplayName("Respuesta con error de Cloudinary no lanza excepción")
    void eliminarImagen_ErrorHttp_NoLanzaExcepcion() throws Exception {
        ReflectionTestUtils.setField(cloudinaryService, "cloudName", "baches-rd-test");
        ReflectionTestUtils.setField(cloudinaryService, "apiKey", "1234567890");
        ReflectionTestUtils.setField(cloudinaryService, "apiSecret", "secretPrueba123");

        HttpResponse<String> resp = mock(HttpResponse.class);
        when(resp.statusCode()).thenReturn(500);
        when(resp.body()).thenReturn("{\"error\":{\"message\":\"Invalid signature\"}}");
        when(httpClient.send(any(HttpRequest.class), any(HttpResponse.BodyHandler.class))).thenReturn(resp);

        cloudinaryService.eliminarImagen("reportes/foto");

        verify(httpClient, times(1)).send(any(HttpRequest.class), any(HttpResponse.BodyHandler.class));
    }

    private String readBody(HttpRequest req) throws Exception {
        java.util.concurrent.CompletableFuture<String> body = new java.util.concurrent.CompletableFuture<>();
        StringBuilder sb = new StringBuilder();
        req.bodyPublisher().orElseThrow().subscribe(new java.util.concurrent.Flow.Subscriber<java.nio.ByteBuffer>() {
            public void onSubscribe(java.util.concurrent.Flow.Subscription s) { s.request(Long.MAX_VALUE); }
            public void onNext(java.nio.ByteBuffer item) { sb.append(java.nio.charset.StandardCharsets.UTF_8.decode(item)); }
            public void onError(Throwable t) { body.completeExceptionally(t); }
            public void onComplete() { body.complete(sb.toString()); }
        });
        return body.get();
    }
}
