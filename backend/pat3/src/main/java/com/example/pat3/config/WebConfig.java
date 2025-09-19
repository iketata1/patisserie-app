package com.example.pat3.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.*;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Value("${app.upload-dir}")
    private String uploadDir;

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // SERT http://localhost:8084/inesk/uploads/xxxx depuis le dossier disque "app.upload-dir"
        String base = uploadDir.replace("\\", "/");
        if (!base.endsWith("/")) base = base + "/";

        registry.addResourceHandler("/uploads/**")
                .addResourceLocations("file:" + base);
        // IMPORTANT : ne pas ajouter "/inesk/uploads/**" ici — le context-path /inesk s'applique tout seul.
    }

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/**")
                .allowedOrigins("http://localhost:4200")
                .allowedMethods("GET","POST","PUT","DELETE","OPTIONS")
                .allowedHeaders("*")
                .allowCredentials(true)
                .maxAge(3600);
    }
}
