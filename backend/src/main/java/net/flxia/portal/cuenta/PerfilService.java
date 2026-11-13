package net.flxia.portal.cuenta;

import net.flxia.portal.comprobantes.ComprobanteService;
import net.flxia.portal.comprobantes.DatosCliente;
import net.flxia.portal.config.ErrorPortal;
import net.flxia.portal.config.FormatoEntrada;
import net.flxia.portal.sesion.SesionActual;
import net.flxia.portal.sesion.SesionRepository;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

/** Profile: name and password. */
@Service
public class PerfilService {

    private final CuentaRepository accounts;
    private final SesionRepository sessions;
    private final ComprobanteService documents;
    private final BCryptPasswordEncoder encoder;

    public PerfilService(CuentaRepository accounts, SesionRepository sessions, ComprobanteService documents,
                         BCryptPasswordEncoder encoder) {
        this.accounts = accounts;
        this.sessions = sessions;
        this.documents = documents;
        this.encoder = encoder;
    }

    public record PerfilDTO(String identification, String fullName, boolean usingDefaultPassword,
                            boolean mustChangePassword, String recoveryEmail) {
    }

    public PerfilDTO get(SesionActual session) {
        Cuenta account = account(session);
        String email = null;
        try {
            DatosCliente customer = ComprobanteService.merge(documents.customer(account.identification()));
            email = FormatoEntrada.maskEmail(customer.email());
        } catch (RuntimeException ignored) {
            // The e-mail is only informative; the profile still opens without it.
        }
        return new PerfilDTO(account.identification(), account.fullName(), account.usingDefaultPassword(),
                account.mustChangePassword(), email);
    }

    public PerfilDTO changeName(SesionActual session, String fullName) {
        String problem = FormatoEntrada.checkName(fullName);
        if (problem != null) {
            throw ErrorPortal.badRequest(problem);
        }
        accounts.changeName(session.accountId(), fullName.strip().replaceAll("\\s+", " "));
        return get(session);
    }

    /**
     * After a temporary password the current one is not asked again (the session
     * was opened with it moments ago); otherwise it is.
     */
    public void changePassword(SesionActual session, String currentPassword, String newPassword) {
        Cuenta account = account(session);
        if (!account.mustChangePassword()) {
            if (currentPassword == null || !FormatoEntrada.isPlausiblePassword(currentPassword)
                    || !encoder.matches(currentPassword, account.passwordHash())) {
                throw ErrorPortal.badRequest("La contraseña actual no es correcta.");
            }
            if (currentPassword.equals(newPassword)) {
                throw ErrorPortal.badRequest("La nueva contraseña debe ser distinta de la actual.");
            }
        }
        String problem = FormatoEntrada.checkPassword(newPassword, account.identification());
        if (problem != null) {
            throw ErrorPortal.badRequest(problem);
        }
        accounts.changePassword(account.accountId(), encoder.encode(newPassword));
        // Any other open session (another device, or whoever knew the old password) ends now.
        sessions.deleteOthersOf(account.accountId(), session.sessionId());
    }

    private Cuenta account(SesionActual session) {
        return accounts.findById(session.accountId())
                .orElseThrow(() -> ErrorPortal.unauthorized("Su sesión terminó. Ingrese de nuevo."));
    }
}
