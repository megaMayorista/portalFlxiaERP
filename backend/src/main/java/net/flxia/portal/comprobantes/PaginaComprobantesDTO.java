package net.flxia.portal.comprobantes;

import java.time.LocalDateTime;
import java.util.List;

/**
 * A page of documents plus the total count, the instances that could not be
 * read this time (their documents may be missing from the list), and a summary
 * of ALL the person's documents for the welcome panel (not affected by filters).
 */
public record PaginaComprobantesDTO(
        List<ComprobanteDTO> items,
        long total,
        int page,
        int size,
        int totalPages,
        List<String> unavailableIssuers,
        long documentCount,
        long invoiceCount,
        long creditNoteCount,
        LocalDateTime lastIssueDate) {
}
