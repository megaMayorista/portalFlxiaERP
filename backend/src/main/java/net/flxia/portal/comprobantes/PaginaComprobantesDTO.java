package net.flxia.portal.comprobantes;

import java.util.List;

/**
 * A page of documents plus the total count, and the instances that could not
 * be read this time (their documents may be missing from the list).
 */
public record PaginaComprobantesDTO(
        List<ComprobanteDTO> items,
        long total,
        int page,
        int size,
        int totalPages,
        List<String> unavailableIssuers) {
}
