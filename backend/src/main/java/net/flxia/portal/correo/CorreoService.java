package net.flxia.portal.correo;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.InternetAddress;
import jakarta.mail.internet.MimeMessage;
import net.flxia.portal.config.ErrorPortal;
import net.flxia.portal.config.PropiedadesPortal;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ClassPathResource;
import org.springframework.mail.MailException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.springframework.web.util.HtmlUtils;

import java.io.UnsupportedEncodingException;
import java.nio.charset.StandardCharsets;
import java.time.Year;

/**
 * E-mails of the portal (the temporary password, and a test message to check
 * the SMTP account), sent through the account in .env (PORTAL_MAIL_USERNAME /
 * PORTAL_MAIL_PASSWORD; for Gmail, an app password).
 *
 * <p>HTML built with tables and inline styles, the only thing every mail client
 * renders the same. The Fluxo logo travels inside the message (cid:), so it is
 * shown even when the client blocks external images.
 */
@Service
public class CorreoService {

    private static final Logger log = LoggerFactory.getLogger(CorreoService.class);
    private static final String LOGO_CID = "logo-fluxo";
    private static final ClassPathResource LOGO = new ClassPathResource("correo/logo-fluxo.png");

    private final ObjectProvider<JavaMailSender> mailSender;
    private final PropiedadesPortal properties;
    private final String username;
    private final String password;

    public CorreoService(ObjectProvider<JavaMailSender> mailSender, PropiedadesPortal properties,
                         @Value("${spring.mail.username:}") String username,
                         @Value("${spring.mail.password:}") String password) {
        this.mailSender = mailSender;
        this.properties = properties;
        this.username = username;
        this.password = password;
    }

    public boolean isConfigured() {
        return !username.isBlank() && !password.isBlank() && mailSender.getIfAvailable() != null;
    }

    /** The real thing: a customer asked for a recovery. */
    public void sendTemporaryPassword(String to, String fullName, String temporaryPassword) {
        String plain = "Hola " + fullName + ",\n\n"
                + "Su contraseña temporal para el Portal de Descargas es: " + temporaryPassword + "\n\n"
                + "Vence en " + properties.tempPasswordHours() + " horas. Al ingresar se le pedirá cambiarla.\n"
                + "Ingrese en " + properties.publicUrl() + "\n\n"
                + "Si usted no la pidió, ignore este mensaje: su contraseña actual sigue funcionando.\n"
                + "Soporte: " + properties.supportPhone() + "\n";
        send(to, "Su contraseña temporal del Portal de Descargas", plain,
                html(fullName, temporaryPassword, false));
    }

    /**
     * Same design with an example password, to check the SMTP account and see the
     * e-mail without touching any customer (see PruebaCorreo).
     */
    public void sendTest(String to) {
        String plain = "Correo de prueba del Portal de Descargas.\n\n"
                + "Así se ve el correo de la contraseña temporal. La clave de ejemplo (Ab3dEf7hJk) no sirve para ingresar.\n"
                + "Si recibió este mensaje, el envío por SMTP funciona.\n";
        send(to, "Prueba de correo · Portal de Descargas", plain, html("Cliente de prueba", "Ab3dEf7hJk", true));
    }

    private void send(String to, String subject, String plain, String html) {
        if (!isConfigured()) {
            log.error("E-mail requested but SMTP is not configured (PORTAL_MAIL_PASSWORD is empty)");
            throw ErrorPortal.unavailable("En este momento no podemos enviar correos. Comuníquese con soporte al "
                    + properties.supportPhone() + ".");
        }
        try {
            JavaMailSender sender = mailSender.getObject();
            MimeMessage message = sender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, MimeMessageHelper.MULTIPART_MODE_MIXED_RELATED,
                    StandardCharsets.UTF_8.name());
            helper.setFrom(new InternetAddress(username, properties.mailFromName(), StandardCharsets.UTF_8.name()));
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(plain, html);
            helper.addInline(LOGO_CID, LOGO, "image/png");
            sender.send(message);
            log.info("E-mail '{}' sent to {}", subject, maskForLog(to));
        } catch (MessagingException | MailException | UnsupportedEncodingException ex) {
            log.error("Could not send '{}' to {}: {}", subject, maskForLog(to), ex.getMessage());
            throw ErrorPortal.unavailable("No pudimos enviar el correo. Inténtelo en unos minutos o comuníquese con soporte al "
                    + properties.supportPhone() + ".");
        }
    }

    private String html(String fullName, String temporaryPassword, boolean test) {
        String name = HtmlUtils.htmlEscape(fullName == null ? "" : fullName);
        String url = HtmlUtils.htmlEscape(properties.publicUrl());
        String phone = HtmlUtils.htmlEscape(properties.supportPhone());
        String whatsapp = phone.replaceAll("[^0-9]", "").replaceFirst("^0", "593");
        String testBanner = test
                ? "<tr><td style=\"padding:14px 36px 0\"><div style=\"background:#fff4ed;border:1px solid #fbd0bd;border-radius:12px;"
                + "padding:10px 14px;font-size:13px;color:#b8431f\"><strong>Correo de prueba.</strong> Así llega la contraseña "
                + "temporal a los clientes. La clave de ejemplo no sirve para ingresar.</div></td></tr>"
                : "";
        return """
                <!doctype html>
                <html lang="es">
                <head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Portal de Descargas</title></head>
                <body style="margin:0;padding:0;background:#eef2f8;font-family:Inter,Segoe UI,Arial,Helvetica,sans-serif;color:#0a1220">
                <table role="presentation" width="100%%" cellspacing="0" cellpadding="0" style="background:#eef2f8;padding:28px 12px">
                <tr><td align="center">
                <table role="presentation" width="100%%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#ffffff;border-radius:20px;overflow:hidden;border:1px solid #dde4ef">
                  <tr><td style="background:#004a8b;background-image:linear-gradient(135deg,#004a8b 0%%,#0a5fb0 55%%,#018bc9 100%%);padding:26px 36px">
                    <table role="presentation" cellspacing="0" cellpadding="0"><tr>
                      <td style="padding-right:12px;vertical-align:middle"><img src="cid:%s" width="40" height="40" alt="FluxoIA" style="display:block;border:0"></td>
                      <td style="vertical-align:middle">
                        <div style="font-size:20px;font-weight:700;color:#ffffff;letter-spacing:-.2px">FluxoIA</div>
                        <div style="font-size:11px;font-weight:600;letter-spacing:2px;text-transform:uppercase;color:#bfe9ff">Portal de Descargas</div>
                      </td>
                    </tr></table>
                  </td></tr>
                  %s
                  <tr><td style="padding:28px 36px 6px">
                    <div style="font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#2563eb">Recuperar acceso</div>
                    <h1 style="margin:8px 0 0;font-size:22px;line-height:1.3;color:#0a1220">Hola, %s</h1>
                    <p style="margin:12px 0 0;font-size:15px;line-height:1.6;color:#4d5a70">Recibimos una solicitud para recuperar su acceso al Portal de Descargas de Documentos Recibidos. Esta es su contraseña temporal:</p>
                  </td></tr>
                  <tr><td style="padding:18px 36px 6px">
                    <div style="background:#f6f8fb;border:1px dashed #9fb6d3;border-radius:16px;padding:18px;text-align:center">
                      <div style="font-size:11px;font-weight:600;letter-spacing:2px;text-transform:uppercase;color:#8593a8">Contraseña temporal</div>
                      <div style="margin-top:6px;font-family:Consolas,Menlo,monospace;font-size:30px;font-weight:700;letter-spacing:4px;color:#0a1220">%s</div>
                      <div style="margin-top:6px;font-size:12px;color:#8593a8">Vence en %d horas · Al ingresar se le pedirá cambiarla</div>
                    </div>
                  </td></tr>
                  <tr><td align="center" style="padding:22px 36px 6px">
                    <a href="%s" style="display:inline-block;background:#f0643b;color:#ffffff;text-decoration:none;font-weight:700;font-size:15px;padding:14px 28px;border-radius:12px">Ingresar al portal</a>
                    <div style="margin-top:10px;font-size:12px;color:#8593a8">Usuario: su RUC o cédula</div>
                  </td></tr>
                  <tr><td style="padding:22px 36px 28px">
                    <p style="margin:0;font-size:13px;line-height:1.6;color:#4d5a70">¿No pidió este cambio? Ignore este mensaje: su contraseña actual sigue funcionando.</p>
                    <p style="margin:10px 0 0;font-size:13px;line-height:1.6;color:#4d5a70">¿Necesita ayuda? Escríbanos al <a href="https://wa.me/%s" style="color:#2563eb;font-weight:600;text-decoration:none">%s</a>.</p>
                  </td></tr>
                  <tr><td style="background:#f6f8fb;border-top:1px solid #e3e8f0;padding:16px 36px;text-align:center;font-size:12px;color:#8593a8">© %d FLUXOERP S.A.S.</td></tr>
                </table>
                </td></tr>
                </table>
                </body></html>
                """.formatted(LOGO_CID, testBanner, name, HtmlUtils.htmlEscape(temporaryPassword),
                properties.tempPasswordHours(), url, whatsapp, phone, Year.now().getValue());
    }

    private static String maskForLog(String email) {
        int at = email.indexOf('@');
        return at <= 1 ? "***" : email.charAt(0) + "***" + email.substring(at);
    }
}
