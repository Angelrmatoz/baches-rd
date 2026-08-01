package com.bachesrd.backend.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.Contact;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI customOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("Baches RD - API REST")
                        .version("1.0.0")
                        .description("Documentación oficial de la API REST para el reporte y validación de baches en Santo Domingo, RD.")
                        .contact(new Contact()
                                .name("Soporte Baches RD")
                                .email("admin@bachesrd.com")));
    }
}
