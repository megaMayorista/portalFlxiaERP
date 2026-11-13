package net.flxia.portal.config;

import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/** /api/public: what the login screen shows before anyone is logged in. */
@RestController
@RequestMapping(path = "/api/public", produces = MediaType.APPLICATION_JSON_VALUE)
public class PublicoController {

    private final PropiedadesPortal properties;

    public PublicoController(PropiedadesPortal properties) {
        this.properties = properties;
    }

    public record ConfiguracionPublicaDTO(String supportPhone, String supportWhatsapp) {
    }

    @GetMapping("/config")
    public ConfiguracionPublicaDTO config() {
        String digits = properties.supportPhone().replaceAll("[^0-9]", "");
        // 0960608410 → 593960608410 for wa.me
        String whatsapp = digits.startsWith("0") ? "593" + digits.substring(1) : digits;
        return new ConfiguracionPublicaDTO(properties.supportPhone(), whatsapp);
    }

    @GetMapping("/health")
    public Map<String, String> health() {
        return Map.of("status", "UP");
    }
}
