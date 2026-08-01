package com.bachesrd.backend.service;

import com.bachesrd.backend.dto.CloudinarySignatureResponse;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.codec.digest.DigestUtils;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Map;
import java.util.TreeMap;
import java.util.stream.Collectors;

@Slf4j
@Service
public class CloudinaryService {

    private static final String DESTROY_URL = "https://api.cloudinary.com/v1_1/";
    private static final String DESTROY_PATH = "/image/destroy";
    private final HttpClient httpClient = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(10)).build();

    @Value("${cloudinary.cloud-name:baches-rd}")
    private String cloudName;

    @Value("${cloudinary.api-key:1234567890}")
    private String apiKey;

    @Value("${cloudinary.api-secret:secret_cloudinary_key_baches}")
    private String apiSecret;

    public CloudinarySignatureResponse generateSignature() {
        long timestamp = System.currentTimeMillis() / 1000L;

        Map<String, String> paramsToSign = new TreeMap<>();
        paramsToSign.put("timestamp", String.valueOf(timestamp));

        String toSign = paramsToSign.entrySet().stream()
                .map(e -> e.getKey() + "=" + e.getValue())
                .collect(Collectors.joining("&")) + apiSecret;

        String signature = DigestUtils.sha1Hex(toSign);

        return CloudinarySignatureResponse.builder()
                .signature(signature)
                .timestamp(timestamp)
                .apiKey(apiKey)
                .cloudName(cloudName)
                .build();
    }

    public String extractPublicIdFromUrl(String url) {
        if (url == null || url.isBlank()) return null;
        if (!url.contains("/upload/")) return null;

        String afterUpload = url.substring(url.indexOf("/upload/") + 8);
        if (afterUpload.matches("^v\\d+/.*")) {
            afterUpload = afterUpload.substring(afterUpload.indexOf('/') + 1);
        }
        int dot = afterUpload.lastIndexOf('.');
        return dot > 0 ? afterUpload.substring(0, dot) : afterUpload;
    }

    public void eliminarImagen(String publicId) {
        if (publicId == null || publicId.isBlank()) return;

        try {
            long timestamp = System.currentTimeMillis() / 1000L;
            Map<String, String> paramsToSign = new TreeMap<>();
            paramsToSign.put("public_id", publicId);
            paramsToSign.put("timestamp", String.valueOf(timestamp));

            String toSign = paramsToSign.entrySet().stream()
                    .map(e -> e.getKey() + "=" + e.getValue())
                    .collect(Collectors.joining("&")) + apiSecret;

            String signature = DigestUtils.sha1Hex(toSign);

            String form = "public_id=" + URLEncoder.encode(publicId, StandardCharsets.UTF_8)
                    + "&timestamp=" + timestamp
                    + "&api_key=" + apiKey
                    + "&signature=" + signature;

            HttpRequest req = HttpRequest.newBuilder()
                    .uri(java.net.URI.create(DESTROY_URL + cloudName + DESTROY_PATH))
                    .header("Content-Type", "application/x-www-form-urlencoded")
                    .timeout(Duration.ofSeconds(15))
                    .POST(HttpRequest.BodyPublishers.ofString(form))
                    .build();

            HttpResponse<String> resp = httpClient.send(req, HttpResponse.BodyHandlers.ofString());

            if (resp.statusCode() != 200 || !resp.body().contains("\"result\":\"ok\"")) {
                log.warn("Cloudinary destroy falló para public_id={}: status={} body={}", publicId, resp.statusCode(), resp.body());
            }
        } catch (Exception e) {
            log.warn("Cloudinary destroy lanzó excepción para public_id={}", publicId, e);
        }
    }
}
