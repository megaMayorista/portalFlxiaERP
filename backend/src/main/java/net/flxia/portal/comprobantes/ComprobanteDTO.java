package net.flxia.portal.comprobantes;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * One row of "Mis comprobantes". Metadata only: the PDF and the XML are fetched
 * (and re-authorized) one by one when the person downloads them.
 */
public record ComprobanteDTO(
        String instanceCode,
        TipoComprobante type,
        String typeUrl,
        String number,
        String issuerRuc,
        String issuerName,
        LocalDateTime issueDate,
        LocalDateTime authorizationDate,
        String accessKey,
        BigDecimal total,
        boolean hasPdf,
        boolean hasXml,
        /** Always true in production; false only for local test-mode documents. */
        boolean authorized) {
}
