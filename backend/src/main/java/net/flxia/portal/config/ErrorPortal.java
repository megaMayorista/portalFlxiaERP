package net.flxia.portal.config;

/**
 * An error the person must see as is: status, a stable code the frontend can
 * branch on, and the message in Spanish. Internal details never travel here.
 */
public class ErrorPortal extends RuntimeException {

    private final int status;
    private final String code;
    private final Long retryAfterSeconds;

    public ErrorPortal(int status, String code, String message) {
        this(status, code, message, null);
    }

    public ErrorPortal(int status, String code, String message, Long retryAfterSeconds) {
        super(message);
        this.status = status;
        this.code = code;
        this.retryAfterSeconds = retryAfterSeconds;
    }

    public static ErrorPortal badRequest(String message) {
        return new ErrorPortal(400, "INVALID_INPUT", message);
    }

    public static ErrorPortal unauthorized(String message) {
        return new ErrorPortal(401, "UNAUTHORIZED", message);
    }

    public static ErrorPortal notFound(String message) {
        return new ErrorPortal(404, "NOT_FOUND", message);
    }

    public static ErrorPortal tooManyAttempts(String message, long retryAfterSeconds) {
        return new ErrorPortal(429, "TOO_MANY_ATTEMPTS", message, retryAfterSeconds);
    }

    public static ErrorPortal unavailable(String message) {
        return new ErrorPortal(503, "UNAVAILABLE", message);
    }

    public int status() {
        return status;
    }

    public String code() {
        return code;
    }

    public Long retryAfterSeconds() {
        return retryAfterSeconds;
    }
}
