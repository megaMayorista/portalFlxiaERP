package net.flxia.portal.comprobantes;

import net.flxia.portal.config.FormatoEntrada;
import net.flxia.portal.instancias.InstanciaERP;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/**
 * The only SQL the portal runs against an ERP database. It reads exactly the
 * columns granted to portal_lectura (sql/preparar_erp_para_portal.sql); keep both
 * files in step.
 *
 * <p>Rules, the same in every query:
 * <ul>
 *   <li>invoice: ord_mascara = 'FACTURA', ord_activo = 1, cse_estado = 'AUTORIZADO';</li>
 *   <li>credit note: ccr_estado_sri = 'AUTORIZADO', ccr_activo = 1, ccr_eliminada = 0;</li>
 *   <li>only the SRI environments configured for the instance (production = 2);</li>
 *   <li>always filtered by the identification of the session: a document is never
 *       read by its key alone.</li>
 * </ul>
 * User input only travels as bound parameters. The environments list comes from
 * the configuration file and is validated to be 1 and/or 2.
 */
@Component
public class ConsultasERP {

    /** Safety cap per instance and kind; the biggest customer today has 111 invoices. */
    private static final int LIST_LIMIT = 5000;

    private static final String INVOICE_FROM =
            " FROM pos.pos_ordenes o"
                    + " JOIN pos.pos_comprobantes_sri c ON c.cse_ord_id = o.ord_id AND c.cse_estado = 'AUTORIZADO'";

    private static String invoiceWhere(InstanciaERP instance) {
        return " WHERE o.ord_cliente_identificacion = ?"
                + " AND o.ord_mascara = 'FACTURA'"
                + " AND o.ord_activo = 1"
                + " AND o.ord_ambiente_sri IN (" + instance.environmentsSql() + ")";
    }

    private static String creditNoteWhere(InstanciaERP instance) {
        return " WHERE n.ccr_cliente_identificacion = ?"
                + " AND n.ccr_estado_sri = 'AUTORIZADO'"
                + " AND n.ccr_activo = 1"
                + " AND n.ccr_eliminada = 0"
                + " AND n.ccr_clave_acceso IS NOT NULL"
                + " AND n.ccr_ambiente_sri IN (" + instance.environmentsSql() + ")";
    }

    // ------------------------------------------------------------------
    //  Listing
    // ------------------------------------------------------------------

    public List<ComprobanteDTO> list(InstanciaERP instance, String identification, boolean invoices, boolean creditNotes) {
        List<ComprobanteDTO> result = new ArrayList<>();
        if (invoices) {
            result.addAll(instance.jdbc().query(
                    "SELECT o.ord_numero_completo AS number, o.ord_fecha_emision AS issue_date, o.ord_total AS total,"
                            + " c.cse_clave_acceso AS access_key, c.cse_fecha_autorizacion AS authorization_date,"
                            + " (c.cse_ride_pdf IS NOT NULL) AS has_pdf, (c.cse_xml_autorizado IS NOT NULL) AS has_xml,"
                            + " cfg.cfg_ruc AS issuer_ruc, cfg.cfg_razon_social AS issuer_name"
                            + INVOICE_FROM
                            + " JOIN pos.pos_puntos_emision pem ON pem.pem_id = o.pem_id"
                            + " LEFT JOIN pos.pos_configuracion cfg ON cfg.cfg_id = pem.cfg_id"
                            + invoiceWhere(instance)
                            + " ORDER BY o.ord_fecha_emision DESC LIMIT " + LIST_LIMIT,
                    (rs, row) -> map(rs, instance, TipoComprobante.INVOICE),
                    identification));
        }
        if (creditNotes && instance.hasCreditNotes()) {
            result.addAll(instance.jdbc().query(
                    "SELECT n.ccr_numero_completo AS number, n.ccr_fecha_emision AS issue_date, n.ccr_total AS total,"
                            + " n.ccr_clave_acceso AS access_key, n.ccr_fecha_autorizacion AS authorization_date,"
                            + " (n.ccr_ride_pdf IS NOT NULL) AS has_pdf, (n.ccr_xml_autorizado IS NOT NULL) AS has_xml,"
                            + " cfg.cfg_ruc AS issuer_ruc, cfg.cfg_razon_social AS issuer_name"
                            + " FROM contabilidad.conta_credito n"
                            + " LEFT JOIN pos.pos_configuracion cfg ON cfg.cfg_id = n.cfg_id"
                            + creditNoteWhere(instance)
                            + " ORDER BY n.ccr_fecha_emision DESC LIMIT " + LIST_LIMIT,
                    (rs, row) -> map(rs, instance, TipoComprobante.CREDIT_NOTE),
                    identification));
        }
        return result;
    }

    private static ComprobanteDTO map(ResultSet rs, InstanciaERP instance, TipoComprobante type) throws SQLException {
        return new ComprobanteDTO(
                instance.code(),
                type,
                type.urlValue(),
                rs.getString("number"),
                rs.getString("issuer_ruc"),
                rs.getString("issuer_name"),
                rs.getObject("issue_date", LocalDateTime.class),
                rs.getObject("authorization_date", LocalDateTime.class),
                rs.getString("access_key"),
                rs.getBigDecimal("total") == null ? BigDecimal.ZERO : rs.getBigDecimal("total"),
                rs.getBoolean("has_pdf"),
                rs.getBoolean("has_xml"));
    }

    // ------------------------------------------------------------------
    //  Download
    // ------------------------------------------------------------------

    /**
     * The stored PDF or XML of one document, only if it belongs to
     * {@code identification} and still meets every rule above.
     */
    public Optional<ArchivoComprobante> file(InstanciaERP instance, TipoComprobante type, String accessKey,
                                             String identification, boolean pdf) {
        List<ArchivoComprobante> rows;
        if (type == TipoComprobante.INVOICE) {
            String column = pdf ? "c.cse_ride_pdf" : "c.cse_xml_autorizado";
            rows = instance.jdbc().query(
                    "SELECT o.ord_numero_completo AS number, " + column + " AS content"
                            + INVOICE_FROM
                            + invoiceWhere(instance)
                            + " AND c.cse_clave_acceso = ?"
                            + " LIMIT 1",
                    (rs, row) -> new ArchivoComprobante(rs.getBytes("content"), rs.getString("number")),
                    identification, accessKey);
        } else {
            if (!instance.hasCreditNotes()) {
                return Optional.empty();
            }
            String column = pdf ? "n.ccr_ride_pdf" : "n.ccr_xml_autorizado";
            rows = instance.jdbc().query(
                    "SELECT n.ccr_numero_completo AS number, " + column + " AS content"
                            + " FROM contabilidad.conta_credito n"
                            + creditNoteWhere(instance)
                            + " AND n.ccr_clave_acceso = ?"
                            + " LIMIT 1",
                    (rs, row) -> new ArchivoComprobante(rs.getBytes("content"), rs.getString("number")),
                    identification, accessKey);
        }
        // The row may come with an empty file (a few old invoices have no RIDE):
        // the service tells that apart from "not yours / does not exist".
        return rows.stream().findFirst();
    }

    // ------------------------------------------------------------------
    //  Customer data (first entry, recovery, profile)
    // ------------------------------------------------------------------

    /** Name on the latest authorized document and the latest usable e-mail, in this instance. */
    public DatosCliente customer(InstanciaERP instance, String identification) {
        DatosCliente data = DatosCliente.NONE;

        List<Object[]> latest = instance.jdbc().query(
                "SELECT o.ord_cliente_nombre, o.ord_fecha_emision" + INVOICE_FROM + invoiceWhere(instance)
                        + " ORDER BY o.ord_fecha_emision DESC LIMIT 1",
                (rs, row) -> new Object[]{rs.getString(1), rs.getObject(2, LocalDateTime.class)},
                identification);
        if (!latest.isEmpty()) {
            List<Object[]> emails = instance.jdbc().query(
                    "SELECT o.ord_cliente_email, o.ord_fecha_emision" + INVOICE_FROM + invoiceWhere(instance)
                            + " AND o.ord_cliente_email LIKE '%@%'"
                            + " ORDER BY o.ord_fecha_emision DESC LIMIT 5",
                    (rs, row) -> new Object[]{rs.getString(1), rs.getObject(2, LocalDateTime.class)},
                    identification);
            data = toCustomer(latest.get(0), emails);
        }

        if (instance.hasCreditNotes()) {
            List<Object[]> latestNote = instance.jdbc().query(
                    "SELECT n.ccr_cliente_nombre, n.ccr_fecha_emision FROM contabilidad.conta_credito n"
                            + creditNoteWhere(instance) + " ORDER BY n.ccr_fecha_emision DESC LIMIT 1",
                    (rs, row) -> new Object[]{rs.getString(1), rs.getObject(2, LocalDateTime.class)},
                    identification);
            if (!latestNote.isEmpty()) {
                List<Object[]> noteEmails = instance.jdbc().query(
                        "SELECT n.ccr_cliente_email, n.ccr_fecha_emision FROM contabilidad.conta_credito n"
                                + creditNoteWhere(instance) + " AND n.ccr_cliente_email LIKE '%@%'"
                                + " ORDER BY n.ccr_fecha_emision DESC LIMIT 5",
                        (rs, row) -> new Object[]{rs.getString(1), rs.getObject(2, LocalDateTime.class)},
                        identification);
                data = data.merge(toCustomer(latestNote.get(0), noteEmails));
            }
        }
        return data;
    }

    private static DatosCliente toCustomer(Object[] latest, List<Object[]> emails) {
        String email = null;
        LocalDateTime emailDate = null;
        for (Object[] row : emails) {
            String usable = FormatoEntrada.usableEmail((String) row[0]);
            if (usable != null) {
                email = usable;
                emailDate = (LocalDateTime) row[1];
                break;
            }
        }
        return new DatosCliente(true, (String) latest[0], (LocalDateTime) latest[1], email, emailDate);
    }
}
