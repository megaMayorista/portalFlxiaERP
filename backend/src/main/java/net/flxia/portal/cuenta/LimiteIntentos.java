package net.flxia.portal.cuenta;

import net.flxia.portal.config.ErrorPortal;
import net.flxia.portal.config.PropiedadesPortal;
import org.springframework.stereotype.Component;

/**
 * Attempt limits, counted in the database (they survive restarts):
 * <ul>
 *   <li>login: 5 failures per identification in 15 minutes, or 20 per IP;</li>
 *   <li>recovery: 3 per identification per hour, or 10 per IP.</li>
 * </ul>
 * A blocked attempt is not recorded, so waiting is always enough to get back in.
 */
@Component
public class LimiteIntentos {

    static final int LOGIN_WINDOW_MINUTES = 15;
    static final int LOGIN_MAX_PER_IDENTIFICATION = 5;
    static final int LOGIN_MAX_PER_IP = 20;
    static final int RECOVERY_WINDOW_MINUTES = 60;
    static final int RECOVERY_MAX_PER_IDENTIFICATION = 3;
    static final int RECOVERY_MAX_PER_IP = 10;

    private final IntentoRepository attempts;
    private final PropiedadesPortal properties;

    public LimiteIntentos(IntentoRepository attempts, PropiedadesPortal properties) {
        this.attempts = attempts;
        this.properties = properties;
    }

    public void checkLogin(String identification, String ip) {
        if (attempts.failedLoginsFromIp(ip, LOGIN_WINDOW_MINUTES) >= LOGIN_MAX_PER_IP) {
            throw ErrorPortal.tooManyAttempts(
                    "Demasiados intentos fallidos desde esta conexión. Espere 15 minutos e inténtelo de nuevo.",
                    LOGIN_WINDOW_MINUTES * 60L);
        }
        if (identification != null
                && attempts.failedLoginsOf(identification, LOGIN_WINDOW_MINUTES) >= LOGIN_MAX_PER_IDENTIFICATION) {
            throw ErrorPortal.tooManyAttempts(
                    "Su usuario quedó bloqueado por 15 minutos tras " + LOGIN_MAX_PER_IDENTIFICATION
                            + " intentos fallidos. Espere o recupere su contraseña.",
                    LOGIN_WINDOW_MINUTES * 60L);
        }
    }

    public void checkRecovery(String identification, String ip) {
        if (attempts.recoveriesFromIp(ip, RECOVERY_WINDOW_MINUTES) >= RECOVERY_MAX_PER_IP
                || (identification != null
                && attempts.recoveriesOf(identification, RECOVERY_WINDOW_MINUTES) >= RECOVERY_MAX_PER_IDENTIFICATION)) {
            throw ErrorPortal.tooManyAttempts(
                    "Ya solicitó varias recuperaciones. Espere una hora o comuníquese con soporte al "
                            + properties.supportPhone() + ".",
                    RECOVERY_WINDOW_MINUTES * 60L);
        }
    }
}
