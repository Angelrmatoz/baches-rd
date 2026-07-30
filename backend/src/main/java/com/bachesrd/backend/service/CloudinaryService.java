package com.bachesrd.backend.service;

import com.bachesrd.backend.dto.CloudinarySignatureResponse;
import org.apache.commons.codec.digest.DigestUtils;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.TreeMap;
import java.util.stream.Collectors;

@Service
public class CloudinaryService {

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

            java.net.http.HttpClient client = java.net.http.HttpClient.newHttpClient();
            String form = "public_id=" + java.net.URLEncoder.encode(publicId, java.nio.charset.StandardCharsets.UTF_8)
                    + "&timestamp=" + timestamp
                    + "&api_key=" + apiKey
                    + "&signature=" + signature;

            java.net.http.HttpRequest req = java.net.http.HttpRequest.newBuilder()
                    .uri(java.net.URI.create("https://api.cloudinary.com/v1_1/" + cloudName + "/image/destroy"))
                    .header("Content-Type", "application/x-www-form-urlencoded")
                    .POST(java.net.http.HttpRequest.BodyPublishers.ofString(form))
                    .build();

            client.sendAsync(req, java.net.http.HttpResponse.BodyHandlers.discarding());
        } catch (Exception ignored) {
            // Non-blocking cleanup
        }
    }
}
