package net.flxia.portal.cuenta;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import net.flxia.portal.config.ClienteIp;
import net.flxia.portal.config.PropiedadesPortal;
import net.flxia.portal.sesion.CookieSesion;
import net.flxia.portal.sesion.SesionActual;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** /api/auth: login, logout, current session and password recovery. */
@RestController
@RequestMapping(path = "/api/auth", produces = MediaType.APPLICATION_JSON_VALUE)
public class IngresoController {

    private final IngresoService service;
    private final CookieSesion cookie;
    private final PropiedadesPortal properties;

    public IngresoController(IngresoService service, CookieSesion cookie, PropiedadesPortal properties) {
        this.service = service;
        this.cookie = cookie;
        this.properties = properties;
    }

    public record SolicitudIngreso(String identification, String password) {
    }

    public record SolicitudRecuperacion(String identification) {
    }

    /** What the screen needs to know about the person logged in. */
    public record SesionDTO(String identification, String fullName, boolean usingDefaultPassword,
                            boolean mustChangePassword) {

        static SesionDTO of(Cuenta account) {
            return new SesionDTO(account.identification(), account.fullName(), account.usingDefaultPassword(),
                    account.mustChangePassword());
        }

        static SesionDTO of(SesionActual session) {
            return new SesionDTO(session.identification(), session.fullName(), session.usingDefaultPassword(),
                    session.mustChangePassword());
        }
    }

    public record RecuperacionDTO(String channel, String maskedEmail, String supportPhone, int temporaryPasswordHours) {
    }

    @PostMapping(path = "/login", consumes = MediaType.APPLICATION_JSON_VALUE)
    public SesionDTO login(@RequestBody SolicitudIngreso body, HttpServletRequest request, HttpServletResponse response) {
        IngresoService.Ingreso ingreso = service.login(body.identification(), body.password(),
                ClienteIp.of(request), ClienteIp.userAgent(request));
        cookie.write(response, ingreso.token());
        return SesionDTO.of(ingreso.account());
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(SesionActual session, HttpServletResponse response) {
        service.logout(session.sessionId());
        cookie.clear(response);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/session")
    public SesionDTO session(SesionActual session) {
        return SesionDTO.of(session);
    }

    @PostMapping(path = "/recover", consumes = MediaType.APPLICATION_JSON_VALUE)
    public RecuperacionDTO recover(@RequestBody SolicitudRecuperacion body, HttpServletRequest request) {
        IngresoService.Recuperacion result = service.recover(body.identification(), ClienteIp.of(request));
        return new RecuperacionDTO(result.channel().name(), result.maskedEmail(), properties.supportPhone(),
                properties.tempPasswordHours());
    }
}
