package net.flxia.portal.sesion;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import net.flxia.portal.config.EscritorRespuestaError;
import net.flxia.portal.config.PropiedadesPortal;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import java.util.Optional;
import java.util.Set;

/**
 * Gate of the API.
 * <ul>
 *   <li>Every request that changes something must carry {@code X-Portal-Request: 1}.
 *       A form or image on another site cannot add that header, and a script on
 *       another site would need a CORS preflight the portal never grants: together
 *       with SameSite=Strict this closes CSRF.</li>
 *   <li>Everything except login, recovery and /api/public needs a live session.</li>
 *   <li>After entering with a temporary password, only the profile (to change it)
 *       and the session endpoints are reachable.</li>
 * </ul>
 */
@Component
public class SesionInterceptor implements HandlerInterceptor {

    public static final String CSRF_HEADER = "X-Portal-Request";
    private static final Set<String> SAFE_METHODS = Set.of("GET", "HEAD", "OPTIONS");
    private static final Set<String> OPEN_PATHS = Set.of("/api/auth/login", "/api/auth/recover");

    private final CookieSesion cookie;
    private final SesionRepository sessions;
    private final PropiedadesPortal properties;
    private final EscritorRespuestaError errors;

    public SesionInterceptor(CookieSesion cookie, SesionRepository sessions, PropiedadesPortal properties,
                             EscritorRespuestaError errors) {
        this.cookie = cookie;
        this.sessions = sessions;
        this.properties = properties;
        this.errors = errors;
    }

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        // getServletPath() is decoded and normalized by the container.
        String path = request.getServletPath();

        if (!SAFE_METHODS.contains(request.getMethod()) && !"1".equals(request.getHeader(CSRF_HEADER))) {
            errors.write(response, 403, "FORBIDDEN", "Solicitud no permitida.");
            return false;
        }

        if (OPEN_PATHS.contains(path) || path.startsWith("/api/public/")) {
            return true;
        }

        Optional<SesionActual> session = cookie.read(request)
                .flatMap(token -> sessions.findActive(GeneradorSecretos.sha256(token), properties.sessionIdleMinutes()));
        if (session.isEmpty()) {
            cookie.clear(response);
            errors.write(response, 401, "UNAUTHORIZED", "Su sesión terminó. Ingrese de nuevo.");
            return false;
        }

        if (session.get().mustChangePassword() && path.startsWith("/api/documents")) {
            errors.write(response, 403, "PASSWORD_CHANGE_REQUIRED",
                    "Ingresó con una contraseña temporal: cámbiela para ver sus comprobantes.");
            return false;
        }

        request.setAttribute(SesionActual.ATTRIBUTE, session.get());
        return true;
    }
}
