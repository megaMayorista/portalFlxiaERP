package net.flxia.portal.cuenta;

import net.flxia.portal.config.PropiedadesPortal;
import net.flxia.portal.sesion.SesionRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/** Once an hour: expired sessions out, and attempts older than 30 days. */
@Component
public class LimpiezaProgramada {

    private static final Logger log = LoggerFactory.getLogger(LimpiezaProgramada.class);

    private final SesionRepository sessions;
    private final IntentoRepository attempts;
    private final PropiedadesPortal properties;

    public LimpiezaProgramada(SesionRepository sessions, IntentoRepository attempts, PropiedadesPortal properties) {
        this.sessions = sessions;
        this.attempts = attempts;
        this.properties = properties;
    }

    @Scheduled(initialDelay = 60_000, fixedDelay = 3_600_000)
    public void clean() {
        try {
            int expired = sessions.deleteExpired(properties.sessionIdleMinutes());
            int old = attempts.deleteOlderThanDays(30);
            if (expired > 0 || old > 0) {
                log.info("Cleanup: {} expired sessions, {} old attempts", expired, old);
            }
        } catch (RuntimeException ex) {
            log.warn("Cleanup failed: {}", ex.getMessage());
        }
    }
}
