package com.bachesrd.backend;

import com.bachesrd.backend.entity.Rol;
import com.bachesrd.backend.entity.Usuario;
import com.bachesrd.backend.repository.UsuarioRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.core.env.Environment;
import org.springframework.data.web.config.EnableSpringDataWebSupport;
import org.springframework.data.web.config.EnableSpringDataWebSupport.PageSerializationMode;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.net.InetAddress;
import java.net.UnknownHostException;

@Slf4j
@SpringBootApplication
@EnableSpringDataWebSupport(pageSerializationMode = PageSerializationMode.VIA_DTO)
public class BackendApplication {

    public static void main(String[] args) {
        SpringApplication app = new SpringApplication(BackendApplication.class);
        Environment env = app.run(args).getEnvironment();
        logApplicationStartup(env);
    }

    @Bean
    CommandLineRunner seedAdmin(UsuarioRepository repo, PasswordEncoder encoder) {
        return args -> {
            if (repo.findByEmail("admin@bachesrd.com").isEmpty()) {
                repo.save(Usuario.builder()
                        .nombre("Administrador Baches RD")
                        .email("admin@bachesrd.com")
                        .passwordHash(encoder.encode("admin123"))
                        .rol(Rol.ADMIN)
                        .activo(true)
                        .build());
                log.info("Usuario administrador creado: admin@bachesrd.com");
            }
        };
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
