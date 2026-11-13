package net.flxia.portal.instancias;

import com.zaxxer.hikari.HikariDataSource;
import org.springframework.jdbc.core.JdbcTemplate;

import java.util.List;
import java.util.stream.Collectors;

/**
 * A FluxoERP instance the portal reads: its own small read-only connection pool
 * (role portal_lectura) and the SRI environments it shows.
 */
public final class InstanciaERP {

    /** How long a "no credit notes here" answer is trusted before asking again. */
    private static final long CREDIT_NOTES_RECHECK_MS = 10 * 60_000L;

    private final String code;
    private final String name;
    private final List<Integer> environments;
    private final String environmentsSql;
    private final boolean testMode;
    private final HikariDataSource dataSource;
    private final JdbcTemplate jdbc;

    private volatile boolean creditNotesAvailable;
    private volatile long creditNotesCheckedAt;

    InstanciaERP(String code, String name, List<Integer> environments, boolean testMode, HikariDataSource dataSource) {
        this.code = code;
        this.name = name;
        this.environments = List.copyOf(environments);
        // Integers from the configuration file (validated 1 or 2), never user input.
        this.environmentsSql = this.environments.stream().map(String::valueOf).collect(Collectors.joining(","));
        this.testMode = testMode;
        this.dataSource = dataSource;
        this.jdbc = new JdbcTemplate(dataSource);
        this.jdbc.setQueryTimeout(8);
    }

    public String code() {
        return code;
    }

    public String name() {
        return name;
    }

    public List<Integer> environments() {
        return environments;
    }

    /** "2" or "1,2", ready for {@code IN (...)}. */
    public String environmentsSql() {
        return environmentsSql;
    }

    /**
     * SRI state accepted for invoices. Always AUTORIZADO, except in local test
     * mode (RegistroInstancias only allows it over http), where any state with a
     * comprobante row is shown so the flows can be tried without a certificate.
     */
    public String invoiceStatusSql() {
        return testMode ? "c.cse_estado IS NOT NULL" : "c.cse_estado = 'AUTORIZADO'";
    }

    /** Same rule for credit notes. */
    public String creditNoteStatusSql() {
        return testMode ? "n.ccr_estado_sri IS NOT NULL" : "n.ccr_estado_sri = 'AUTORIZADO'";
    }

    public JdbcTemplate jdbc() {
        return jdbc;
    }

    /**
     * True when this instance has contabilidad.conta_credito and the role can read
     * it. Older instances (or one prepared before the table existed) simply have no
     * credit notes, instead of failing every listing.
     */
    public boolean hasCreditNotes() {
        long now = System.currentTimeMillis();
        if (creditNotesAvailable || now - creditNotesCheckedAt < CREDIT_NOTES_RECHECK_MS) {
            return creditNotesAvailable;
        }
        Boolean available = jdbc.queryForObject(
                "SELECT CASE WHEN to_regclass('contabilidad.conta_credito') IS NULL THEN false "
                        + "ELSE has_column_privilege('contabilidad.conta_credito', 'ccr_xml_autorizado', 'SELECT') END",
                Boolean.class);
        creditNotesAvailable = Boolean.TRUE.equals(available);
        creditNotesCheckedAt = now;
        return creditNotesAvailable;
    }

    void close() {
        dataSource.close();
    }
}
