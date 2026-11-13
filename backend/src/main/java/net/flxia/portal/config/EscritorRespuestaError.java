package net.flxia.portal.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.nio.charset.StandardCharsets;

/**
 * Writes the error body from places that run before a controller (the session
 * interceptor), so every error looks the same as the ones from ManejadorErrores.
 */
@Component
public class EscritorRespuestaError {

    private final ObjectMapper objectMapper;

    public EscritorRespuestaError(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    public void write(HttpServletResponse response, int status, String code, String message) throws IOException {
        if (response.isCommitted()) {
            return;
        }
        response.resetBuffer();
        response.setStatus(status);
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setCharacterEncoding(StandardCharsets.UTF_8.name());
        response.getOutputStream().write(objectMapper.writeValueAsBytes(new RespuestaErrorDTO(status, code, message)));
        response.flushBuffer();
    }
}
