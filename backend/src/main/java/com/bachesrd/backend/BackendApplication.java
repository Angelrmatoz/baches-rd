package com.bachesrd.backend;

import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.core.env.Environment;

import java.net.InetAddress;
import java.net.UnknownHostException;

@Slf4j
@SpringBootApplication
public class BackendApplication {

    public static void main(String[] args) {
        SpringApplication app = new SpringApplication(BackendApplication.class);
        Environment env = app.run(args).getEnvironment();
        logApplicationStartup(env);
    }

    private static void logApplicationStartup(Environment env) {
        String protocol = "http";
        if (env.getProperty("server.ssl.key-store") != null) {
            protocol = "https";
        }
        String serverPort = env.getProperty("server.port", "8080");
        String contextPath = env.getProperty("server.servlet.context-path", "");
        if (contextPath.isBlank()) {
            contextPath = "/";
        }
        String hostAddress = "localhost";
        try {
            hostAddress = InetAddress.getLocalHost().getHostAddress();
        } catch (UnknownHostException e) {
            log.warn("No se pudo determinar la dirección IP local: {}", e.getMessage());
        }

        log.info("""
                
                ----------------------------------------------------------
                \tAplicación '{}' iniciada correctamente.
                \tPerfil(es) activo(s): \t{}
                \tURL Local: \t\t{}://localhost:{}{}
                \tURL Red Externa: \t{}://{}:{}{}
                \tDocumentación Swagger: \t{}://localhost:{}{}swagger-ui/index.html
                ----------------------------------------------------------
                """,
                env.getProperty("spring.application.name"),
                env.getActiveProfiles().length == 0 ? "default" : String.join(", ", env.getActiveProfiles()),
                protocol, serverPort, contextPath,
                protocol, hostAddress, serverPort, contextPath,
                protocol, serverPort, contextPath.endsWith("/") ? contextPath : contextPath + "/");
    }

}
