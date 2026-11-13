package net.flxia.portal.cuenta;

import net.flxia.portal.sesion.SesionActual;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** /api/profile */
@RestController
@RequestMapping(path = "/api/profile", produces = MediaType.APPLICATION_JSON_VALUE)
public class PerfilController {

    private final PerfilService service;

    public PerfilController(PerfilService service) {
        this.service = service;
    }

    public record SolicitudNombre(String fullName) {
    }

    public record SolicitudClave(String currentPassword, String newPassword) {
    }

    @GetMapping
    public PerfilService.PerfilDTO get(SesionActual session) {
        return service.get(session);
    }

    @PutMapping(consumes = MediaType.APPLICATION_JSON_VALUE)
    public PerfilService.PerfilDTO changeName(SesionActual session, @RequestBody SolicitudNombre body) {
        return service.changeName(session, body.fullName());
    }

    @PostMapping(path = "/password", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<Void> changePassword(SesionActual session, @RequestBody SolicitudClave body) {
        service.changePassword(session, body.currentPassword(), body.newPassword());
        return ResponseEntity.noContent().build();
    }
}
