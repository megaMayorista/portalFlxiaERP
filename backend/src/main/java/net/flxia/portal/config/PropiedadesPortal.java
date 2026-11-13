package net.flxia.portal.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

import java.util.List;

/**
 * Settings under {@code portal.*}: application.yml plus config/instancias.yml,
 * which lists the ERP instances the portal reads.
 */
@ConfigurationProperties(prefix = "portal")
public record PropiedadesPortal(
        String publicUrl,
        String supportPhone,
        boolean cookieSecure,
        int sessionIdleMinutes,
        int sessionMaxHours,
        int tempPasswordHours,
        String mailFromName,
        long instanceTimeoutMs,
        List<Instancia> instances) {

    public PropiedadesPortal {
        instances = instances == null ? List.of() : List.copyOf(instances);
        if (sessionIdleMinutes <= 0) {
            sessionIdleMinutes = 120;
        }
        if (sessionMaxHours <= 0) {
            sessionMaxHours = 12;
        }
        if (tempPasswordHours <= 0) {
            tempPasswordHours = 24;
        }
        if (instanceTimeoutMs <= 0) {
            instanceTimeoutMs = 6000;
        }
    }

    /**
     * One FluxoERP instance (one business, possibly several RUCs).
     *
     * @param code         short id used in download URLs: lowercase, digits and dashes
     * @param name         name shown when the instance is unavailable
     * @param jdbcUrl      e.g. jdbc:postgresql://host.docker.internal:5433/erp_megamayorista
     * @param username     always the read-only role portal_lectura
     * @param password     that role's password in this instance
     * @param environments SRI environments shown: [2] = production only
     * @param enabled      false to take an instance out without deleting its entry
     * @param testMode     LOCAL ONLY: also show documents the SRI has not authorized
     *                     (a local ERP has no signing certificate). Ignored when the
     *                     portal runs over https (production).
     */
    public record Instancia(
            String code,
            String name,
            String jdbcUrl,
            String username,
            String password,
            List<Integer> environments,
            Boolean enabled,
            Boolean testMode) {

        public boolean isEnabled() {
            return enabled == null || enabled;
        }

        public boolean wantsTestMode() {
            return Boolean.TRUE.equals(testMode);
        }
    }
}
