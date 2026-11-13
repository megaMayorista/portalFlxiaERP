package net.flxia.portal.config;

/** Body of every error answer: {"status":400,"code":"INVALID_INPUT","message":"..."}. */
public record RespuestaErrorDTO(int status, String code, String message) {
}
