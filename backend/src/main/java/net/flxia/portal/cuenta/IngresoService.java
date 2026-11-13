package net.flxia.portal.cuenta;

import net.flxia.portal.comprobantes.ComprobanteService;
import net.flxia.portal.comprobantes.DatosCliente;
import net.flxia.portal.config.ErrorPortal;
import net.flxia.portal.config.FormatoEntrada;
import net.flxia.portal.config.PropiedadesPortal;
import net.flxia.portal.correo.CorreoService;
import net.flxia.portal.instancias.ResultadoParalelo;
import net.flxia.portal.sesion.GeneradorSecretos;
import net.flxia.portal.sesion.SesionRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

/**
 * Login and password recovery.
 *
 * <p>There is no sign-up. The first time, user and password are the cédula or RUC;
 * the account is created then, only if that identification has at least one
 * authorized document in some instance, with the name of its latest one.
 */
@Service
public class IngresoService {

    private static final Logger log = LoggerFactory.getLogger(IngresoService.class);

    private static final String WRONG_CREDENTIALS = "Usuario o contraseña incorrectos.";
    private static final String NO_DOCUMENTS =
            "No encontramos comprobantes electrónicos emitidos a esta identificación.";
    private static final String ISSUERS_DOWN =
            "No pudimos consultar a todos los emisores en este momento. Inténtelo de nuevo en unos minutos.";

    private final CuentaRepository accounts;
    private final SesionRepository sessions;
    private final IntentoRepository attempts;
    private final LimiteIntentos limits;
    private final ComprobanteService documents;
    private final CorreoService mail;
    private final BCryptPasswordEncoder encoder;
    private final PropiedadesPortal properties;

    public IngresoService(CuentaRepository accounts, SesionRepository sessions, IntentoRepository attempts,
                          LimiteIntentos limits, ComprobanteService documents, CorreoService mail,
                          BCryptPasswordEncoder encoder, PropiedadesPortal properties) {
        this.accounts = accounts;
        this.sessions = sessions;
        this.attempts = attempts;
        this.limits = limits;
        this.documents = documents;
        this.mail = mail;
        this.encoder = encoder;
        this.properties = properties;
    }

    /** A new session: the token goes in the cookie, the account to the screen. */
    public record Ingreso(String token, Cuenta account, boolean withTemporaryPassword) {
    }

    public Ingreso login(String rawIdentification, String password, String ip, String userAgent) {
        String identification = FormatoEntrada.normalizeIdentification(rawIdentification);
        if (!FormatoEntrada.isValidIdentification(identification)) {
            limits.checkLogin(null, ip);
            attempts.record(IntentoRepository.LOGIN, null, ip, false);
            throw ErrorPortal.badRequest(FormatoEntrada.IDENTIFICATION_MESSAGE);
        }
        limits.checkLogin(identification, ip);

        if (!FormatoEntrada.isPlausiblePassword(password)) {
            return fail(identification, ip);
        }

        Cuenta account = accounts.findByIdentification(identification).orElse(null);
        boolean withTemporary = false;

        if (account == null) {
            // First entry: the password must be the identification itself.
            if (!password.equals(identification)) {
                return fail(identification, ip);
            }
            ResultadoParalelo<DatosCliente> found = documents.customer(identification);
            DatosCliente customer = ComprobanteService.merge(found);
            if (!customer.hasDocuments()) {
                attempts.record(IntentoRepository.LOGIN, identification, ip, false);
                throw found.partial() ? ErrorPortal.unavailable(ISSUERS_DOWN) : ErrorPortal.unauthorized(NO_DOCUMENTS);
            }
            accounts.createIfMissing(identification, nameFor(customer, identification), encoder.encode(identification));
            account = accounts.findByIdentification(identification).orElseThrow();
            log.info("Portal account created for an identification with documents (account {})", account.accountId());
        } else if (!encoder.matches(password, account.passwordHash())) {
            if (account.tempPasswordValid() && encoder.matches(password, account.tempPasswordHash())) {
                withTemporary = true;
            } else {
                return fail(identification, ip);
            }
        }

        attempts.record(IntentoRepository.LOGIN, identification, ip, true);
        accounts.recordLogin(account.accountId(), withTemporary);
        String token = GeneradorSecretos.sessionToken();
        sessions.create(GeneradorSecretos.sha256(token), account.accountId(), properties.sessionMaxHours(), ip, userAgent);
        Cuenta current = accounts.findById(account.accountId()).orElseThrow();
        return new Ingreso(token, current, withTemporary);
    }

    private Ingreso fail(String identification, String ip) {
        attempts.record(IntentoRepository.LOGIN, identification, ip, false);
        throw ErrorPortal.unauthorized(WRONG_CREDENTIALS);
    }

    private static String nameFor(DatosCliente customer, String identification) {
        String name = FormatoEntrada.cleanImportedName(customer.name());
        return name.length() < FormatoEntrada.NAME_MIN ? identification : name;
    }

    // ------------------------------------------------------------------
    //  Recovery
    // ------------------------------------------------------------------

    public enum Canal { EMAIL, IDENTIFICATION }

    public record Recuperacion(Canal channel, String maskedEmail) {
    }

    /**
     * With an e-mail on their documents: a temporary password goes there (the
     * current one keeps working). Without one: the password goes back to the
     * identification, as decided for the portal.
     */
    public Recuperacion recover(String rawIdentification, String ip) {
        String identification = FormatoEntrada.normalizeIdentification(rawIdentification);
        if (!FormatoEntrada.isValidIdentification(identification)) {
            limits.checkRecovery(null, ip);
            attempts.record(IntentoRepository.RECOVERY, null, ip, false);
            throw ErrorPortal.badRequest(FormatoEntrada.IDENTIFICATION_MESSAGE);
        }
        limits.checkRecovery(identification, ip);

        ResultadoParalelo<DatosCliente> found = documents.customer(identification);
        DatosCliente customer = ComprobanteService.merge(found);
        Cuenta account = accounts.findByIdentification(identification).orElse(null);

        if (account == null) {
            if (!customer.hasDocuments()) {
                attempts.record(IntentoRepository.RECOVERY, identification, ip, false);
                throw found.partial() ? ErrorPortal.unavailable(ISSUERS_DOWN) : ErrorPortal.notFound(NO_DOCUMENTS);
            }
            accounts.createIfMissing(identification, nameFor(customer, identification), encoder.encode(identification));
            account = accounts.findByIdentification(identification).orElseThrow();
        }

        if (customer.email() != null) {
            String temporary = GeneradorSecretos.temporaryPassword();
            mail.sendTemporaryPassword(customer.email(), account.fullName(), temporary);
            accounts.setTemporaryPassword(account.accountId(), encoder.encode(temporary), properties.tempPasswordHours());
            attempts.record(IntentoRepository.RECOVERY, identification, ip, true);
            return new Recuperacion(Canal.EMAIL, FormatoEntrada.maskEmail(customer.email()));
        }

        if (found.partial()) {
            // The e-mail may be in the instance that did not answer: do not reset blindly.
            attempts.record(IntentoRepository.RECOVERY, identification, ip, false);
            throw ErrorPortal.unavailable(ISSUERS_DOWN);
        }
        accounts.resetToIdentification(account.accountId(), encoder.encode(identification));
        sessions.deleteAllOf(account.accountId());
        attempts.record(IntentoRepository.RECOVERY, identification, ip, true);
        return new Recuperacion(Canal.IDENTIFICATION, null);
    }

    public void logout(long sessionId) {
        sessions.delete(sessionId);
    }
}
