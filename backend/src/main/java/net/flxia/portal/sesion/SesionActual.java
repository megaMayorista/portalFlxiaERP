package net.flxia.portal.sesion;

/** The logged-in person, as the interceptor found it for this request. */
public record SesionActual(
        long sessionId,
        long accountId,
        String identification,
        String fullName,
        boolean mustChangePassword,
        boolean usingDefaultPassword) {

    /** Request attribute where the interceptor leaves it. */
    public static final String ATTRIBUTE = "portal.session";
}
