package net.flxia.portal.sesion;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import net.flxia.portal.config.PropiedadesPortal;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.util.Optional;
import java.util.regex.Pattern;

/**
 * The session cookie: HttpOnly (JavaScript cannot read it, so an injected
 * script cannot steal it), SameSite=Strict (other sites cannot send it) and
 * Secure in production (https only).
 */
@Component
public class CookieSesion {

    /**
     * In production (https) the cookie carries the __Host- prefix: the browser
     * only accepts it with Secure, Path=/ and no Domain, so no subdomain of
     * flxia.net and no plain-http page can plant or overwrite it. Locally
     * (http) the prefix is not allowed and the plain name is used.
     */
    private static final String SECURE_NAME = "__Host-portal_session";
    private static final String LOCAL_NAME = "portal_session";
    private static final Pattern TOKEN = Pattern.compile("^[A-Za-z0-9_-]{43}$");

    private final PropiedadesPortal properties;
    private final String name;

    public CookieSesion(PropiedadesPortal properties) {
        this.properties = properties;
        this.name = properties.cookieSecure() ? SECURE_NAME : LOCAL_NAME;
    }

    public Optional<String> read(HttpServletRequest request) {
        Cookie[] cookies = request.getCookies();
        if (cookies == null) {
            return Optional.empty();
        }
        for (Cookie cookie : cookies) {
            if (name.equals(cookie.getName()) && cookie.getValue() != null && TOKEN.matcher(cookie.getValue()).matches()) {
                return Optional.of(cookie.getValue());
            }
        }
        return Optional.empty();
    }

    public void write(HttpServletResponse response, String token) {
        response.addHeader(HttpHeaders.SET_COOKIE, base(token).maxAge(Duration.ofHours(properties.sessionMaxHours())).build().toString());
    }

    public void clear(HttpServletResponse response) {
        response.addHeader(HttpHeaders.SET_COOKIE, base("").maxAge(Duration.ZERO).build().toString());
    }

    private ResponseCookie.ResponseCookieBuilder base(String value) {
        return ResponseCookie.from(name, value)
                .httpOnly(true)
                .secure(properties.cookieSecure())
                .sameSite("Strict")
                .path("/");
    }
}
