package net.flxia.portal.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * Security headers of every API response, in one place. Runs first, so errors
 * written by the interceptor carry them too. The pages themselves get theirs
 * from the frontend's nginx.
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE + 10)
public class CabecerasSeguridadFilter extends OncePerRequestFilter {

    private static final String HSTS = "max-age=31536000; includeSubDomains";

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {

        response.setHeader("X-Content-Type-Options", "nosniff");
        // Personal documents: nothing is ever stored by the browser or a proxy.
        response.setHeader("Cache-Control", "no-store");
        response.setHeader("Pragma", "no-cache");
        response.setHeader("Expires", "0");
        response.setHeader("Content-Security-Policy", "default-src 'none'; frame-ancestors 'none'; sandbox");
        response.setHeader("X-Frame-Options", "DENY");
        response.setHeader("Referrer-Policy", "no-referrer");
        response.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=(), usb=()");
        response.setHeader("Cross-Origin-Opener-Policy", "same-origin");
        response.setHeader("Cross-Origin-Resource-Policy", "same-origin");
        response.setHeader("X-Permitted-Cross-Domain-Policies", "none");
        response.setHeader("X-Download-Options", "noopen");

        if (ClienteIp.cameOverHttps(request)) {
            response.setHeader("Strict-Transport-Security", HSTS);
        }

        chain.doFilter(request, response);
    }
}
