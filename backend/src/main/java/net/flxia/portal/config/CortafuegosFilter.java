package net.flxia.portal.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.util.regex.Pattern;

/**
 * Request firewall of the API, the same idea as Spring Security's
 * StrictHttpFirewall (the portal does not use Spring Security).
 *
 * <p>It is defense in depth: every query is already parameterized, every path
 * variable has a strict format and React escapes everything it prints. The
 * frontend's nginx blocks the same things first; this filter keeps the backend
 * safe even if it were reached some other way. A blocked request gets 403
 * FORBIDDEN, which the frontend turns into the 403 view, and a warning in the log.
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE + 20)
public class CortafuegosFilter extends OncePerRequestFilter {

    private static final Logger log = LoggerFactory.getLogger(CortafuegosFilter.class);

    private static final int MAX_URI_LENGTH = 512;
    private static final int MAX_QUERY_LENGTH = 512;

    /** Path tricks in the raw URI: nested or encoded traversal, matrix params, NUL, backslashes, double slashes. */
    private static final Pattern BAD_PATH = Pattern.compile(
            "(?i)(//|/\\./|/\\.\\./|/\\.\\.?$|;|%2f|%5c|%25|%2e|%00|\\\\)");

    /** Injection and XSS signatures, checked on the decoded path and query. */
    private static final Pattern ATTACK = Pattern.compile(
            "(?i)("
                    + "<\\s*(script|svg|iframe|img|object|embed|style|link|meta)"
                    + "|(javascript|vbscript|data)\\s*:"
                    + "|on(error|load|mouseover|focus|click|toggle)\\s*="
                    // \b: "Comercial Union Selecta" is a business name, not an injection.
                    + "|union(\\s|/\\*.*?\\*/)+(all\\s+)?select\\b"
                    + "|information_schema|pg_catalog|pg_sleep|sleep\\s*\\(|benchmark\\s*\\(|waitfor\\s+delay"
                    + "|'\\s*(or|and)\\s|;\\s*(drop|delete|insert|update|alter|create|truncate|shutdown)\\s"
                    + "|\\{jndi:|\\.\\./|etc/passwd|proc/self"
                    + ")");

    private final EscritorRespuestaError errors;

    public CortafuegosFilter(EscritorRespuestaError errors) {
        this.errors = errors;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        String reason = check(request);
        if (reason != null) {
            log.warn("Firewall blocked {} {} from {} ({})", request.getMethod(), shorten(request.getRequestURI()),
                    ClienteIp.of(request), reason);
            errors.write(response, 403, "FORBIDDEN", "Solicitud bloqueada por seguridad.");
            return;
        }
        chain.doFilter(request, response);
    }

    /** Why the request is blocked, or null when it may pass (package-private for the tests). */
    static String check(HttpServletRequest request) {
        String uri = request.getRequestURI();
        String query = request.getQueryString();
        if (uri == null || uri.length() > MAX_URI_LENGTH) {
            return "uri too long";
        }
        if (query != null && query.length() > MAX_QUERY_LENGTH) {
            return "query too long";
        }
        if (BAD_PATH.matcher(uri).find() || hasControlCharacters(uri)) {
            return "path trick";
        }
        String decoded;
        try {
            decoded = URLDecoder.decode(uri, StandardCharsets.UTF_8)
                    + (query == null ? "" : "?" + URLDecoder.decode(query, StandardCharsets.UTF_8));
        } catch (IllegalArgumentException ex) {
            return "malformed encoding";
        }
        if (hasControlCharacters(decoded)) {
            return "control characters";
        }
        if (ATTACK.matcher(decoded).find()) {
            return "attack signature";
        }
        return null;
    }

    private static boolean hasControlCharacters(String text) {
        return text.chars().anyMatch(c -> c < 0x20 || c == 0x7f);
    }

    private static String shorten(String text) {
        if (text == null) {
            return "";
        }
        String clean = text.replaceAll("[^\\x20-\\x7e]", "?");
        return clean.length() > 120 ? clean.substring(0, 120) + "…" : clean;
    }
}
