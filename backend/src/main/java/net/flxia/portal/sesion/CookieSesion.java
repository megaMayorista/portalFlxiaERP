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

    public static final String NAME = "portal_session";
    private static final Pattern TOKEN = Pattern.compile("^[A-Za-z0-9_-]{43}$");

    private final PropiedadesPortal properties;

    public CookieSesion(PropiedadesPortal properties) {
        this.properties = properties;
    }

    public Optional<String> read(HttpServletRequest request) {
        Cookie[] cookies = request.getCookies();
        if (cookies == null) {
            return Optional.empty();
        }
        for (Cookie cookie : cookies) {
            if (NAME.equals(cookie.getName()) && cookie.getValue() != null && TOKEN.matcher(cookie.getValue()).matches()) {
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
        return ResponseCookie.from(NAME, value)
                .httpOnly(true)
                .secure(properties.cookieSecure())
                .sameSite("Strict")
                .path("/");
    }
}
