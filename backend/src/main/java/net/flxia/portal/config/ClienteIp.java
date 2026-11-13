package net.flxia.portal.config;

import jakarta.servlet.http.HttpServletRequest;

import java.util.regex.Pattern;

/**
 * Who is calling. The backend has no published port: it is only reachable
 * through the frontend's nginx, which sets X-Real-IP to the address it saw (or
 * the one the host's nginx passed on), so that header can be trusted.
 */
public final class ClienteIp {

    /** IPv4 or IPv6 text; any other header value is ignored. */
    private static final Pattern IP_ADDRESS = Pattern.compile("^[0-9A-Fa-f:.]{2,45}$");

    private ClienteIp() {
    }

    public static String of(HttpServletRequest request) {
        String realIp = request.getHeader("X-Real-IP");
        if (realIp != null && IP_ADDRESS.matcher(realIp.trim()).matches()) {
            return realIp.trim();
        }
        String remote = request.getRemoteAddr();
        return remote == null ? "0.0.0.0" : remote;
    }

    public static String userAgent(HttpServletRequest request) {
        String agent = request.getHeader("User-Agent");
        if (agent == null) {
            return null;
        }
        return agent.length() > 300 ? agent.substring(0, 300) : agent;
    }

    /** TLS ends at the host's nginx, which reports the original scheme in X-Forwarded-Proto. */
    public static boolean cameOverHttps(HttpServletRequest request) {
        if (request.isSecure()) {
            return true;
        }
        String proto = request.getHeader("X-Forwarded-Proto");
        return proto != null && "https".equalsIgnoreCase(proto.split(",")[0].trim());
    }
}
