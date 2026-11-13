package net.flxia.portal.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.HttpMediaTypeNotSupportedException;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.servlet.NoHandlerFoundException;
import org.springframework.web.servlet.resource.NoResourceFoundException;

/**
 * Turns every exception into the error body. Stack traces and internal details
 * are logged, never returned to the browser.
 */
@RestControllerAdvice
public class ManejadorErrores {

    private static final Logger log = LoggerFactory.getLogger(ManejadorErrores.class);

    @ExceptionHandler(ErrorPortal.class)
    public ResponseEntity<RespuestaErrorDTO> handlePortalError(ErrorPortal ex) {
        ResponseEntity.BodyBuilder builder = ResponseEntity.status(ex.status());
        if (ex.retryAfterSeconds() != null) {
            builder.header("Retry-After", String.valueOf(ex.retryAfterSeconds()));
        }
        return builder.body(new RespuestaErrorDTO(ex.status(), ex.code(), ex.getMessage()));
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<RespuestaErrorDTO> handleNotReadable(HttpMessageNotReadableException ex) {
        // Only the type: parser messages quote pieces of the raw body (passwords).
        log.warn("Unreadable request body: {}", ex.getMostSpecificCause().getClass().getSimpleName());
        return build(HttpStatus.BAD_REQUEST, "INVALID_INPUT", "La solicitud no tiene un formato válido.");
    }

    @ExceptionHandler({MethodArgumentTypeMismatchException.class, MissingServletRequestParameterException.class})
    public ResponseEntity<RespuestaErrorDTO> handleBadParameter(Exception ex) {
        return build(HttpStatus.BAD_REQUEST, "INVALID_INPUT", "Uno de los filtros no tiene un formato válido.");
    }

    @ExceptionHandler({NoResourceFoundException.class, NoHandlerFoundException.class})
    public ResponseEntity<RespuestaErrorDTO> handleNoHandler(Exception ex) {
        return build(HttpStatus.NOT_FOUND, "NOT_FOUND", "Recurso no encontrado.");
    }

    @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
    public ResponseEntity<RespuestaErrorDTO> handleMethod(HttpRequestMethodNotSupportedException ex) {
        return build(HttpStatus.METHOD_NOT_ALLOWED, "METHOD_NOT_ALLOWED", "Método no permitido.");
    }

    @ExceptionHandler(HttpMediaTypeNotSupportedException.class)
    public ResponseEntity<RespuestaErrorDTO> handleMediaType(HttpMediaTypeNotSupportedException ex) {
        return build(HttpStatus.UNSUPPORTED_MEDIA_TYPE, "INVALID_INPUT", "La solicitud debe enviarse en formato JSON.");
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<RespuestaErrorDTO> handleUnexpected(Exception ex) {
        log.error("Unexpected error", ex);
        return build(HttpStatus.INTERNAL_SERVER_ERROR, "INTERNAL_ERROR",
                "Ocurrió un error inesperado. Inténtelo de nuevo en unos minutos.");
    }

    private static ResponseEntity<RespuestaErrorDTO> build(HttpStatus status, String code, String message) {
        return ResponseEntity.status(status).body(new RespuestaErrorDTO(status.value(), code, message));
    }
}
