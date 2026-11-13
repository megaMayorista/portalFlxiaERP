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
import org.springframework.mail.MailException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.springframework.web.util.HtmlUtils;

import java.io.UnsupportedEncodingException;
import java.nio.charset.StandardCharsets;

/**
 * E-mails of the portal (today only the temporary password), sent through the
 * SMTP account in .env (PORTAL_MAIL_USERNAME / PORTAL_MAIL_PASSWORD; for Gmail,
 * an app password).
 */
@Service
public class CorreoService {

    private static final Logger log = LoggerFactory.getLogger(CorreoService.class);

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

    public void sendTemporaryPassword(String to, String fullName, String temporaryPassword) {
        if (!isConfigured()) {
            log.error("Temporary password requested but SMTP is not configured (PORTAL_MAIL_PASSWORD is empty)");
            throw ErrorPortal.unavailable("En este momento no podemos enviar correos. Comuníquese con soporte al "
                    + properties.supportPhone() + ".");
        }
        try {
            JavaMailSender sender = mailSender.getObject();
            MimeMessage message = sender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, false, StandardCharsets.UTF_8.name());
            helper.setFrom(new InternetAddress(username, properties.mailFromName(), StandardCharsets.UTF_8.name()));
            helper.setTo(to);
            helper.setSubject("Su contraseña temporal del Portal de Descargas");
            helper.setText(plainText(fullName, temporaryPassword), html(fullName, temporaryPassword));
            sender.send(message);
            log.info("Temporary password sent to {}", maskForLog(to));
        } catch (MessagingException | MailException | UnsupportedEncodingException ex) {
            log.error("Could not send the temporary password to {}: {}", maskForLog(to), ex.getMessage());
            throw ErrorPortal.unavailable("No pudimos enviar el correo. Inténtelo en unos minutos o comuníquese con soporte al "
                    + properties.supportPhone() + ".");
        }
    }

    private String plainText(String fullName, String temporaryPassword) {
        return "Hola " + fullName + ",\n\n"
                + "Su contraseña temporal para el Portal de Descargas es: " + temporaryPassword + "\n\n"
                + "Vence en " + properties.tempPasswordHours() + " horas. Al ingresar se le pedirá cambiarla.\n"
                + "Ingrese en " + properties.publicUrl() + "\n\n"
                + "Si usted no la pidió, ignore este mensaje: su contraseña actual sigue funcionando.\n"
                + "Soporte: " + properties.supportPhone() + "\n";
    }

    private String html(String fullName, String temporaryPassword) {
        String name = HtmlUtils.htmlEscape(fullName == null ? "" : fullName);
        String url = HtmlUtils.htmlEscape(properties.publicUrl());
        String phone = HtmlUtils.htmlEscape(properties.supportPhone());
        return """
                <!doctype html>
                <html lang="es"><body style="margin:0;padding:24px;background:#f6f8fb;font-family:Arial,Helvetica,sans-serif;color:#0a1220">
                <table role="presentation" width="100%%" cellspacing="0" cellpadding="0" style="max-width:520px;margin:0 auto;background:#ffffff;border-radius:16px;border:1px solid #e3e8f0">
                  <tr><td style="padding:28px 32px 8px">
                    <div style="font-size:20px;font-weight:bold;color:#018bc9">FluxoIA</div>
                    <div style="font-size:13px;color:#4d5a70">Portal de Descargas de Documentos Recibidos</div>
                  </td></tr>
                  <tr><td style="padding:16px 32px 8px;font-size:15px;line-height:1.5">
                    <p>Hola %s,</p>
                    <p>Su contraseña temporal es:</p>
                    <p style="font-size:26px;letter-spacing:3px;font-weight:bold;background:#edf1f8;border-radius:10px;padding:14px;text-align:center;font-family:Consolas,monospace">%s</p>
                    <p>Vence en %d horas. Al ingresar se le pedirá cambiarla por una propia.</p>
                    <p style="text-align:center;margin:24px 0"><a href="%s" style="background:#2563eb;color:#ffffff;text-decoration:none;padding:12px 22px;border-radius:10px;font-weight:bold">Ir al portal</a></p>
                    <p style="font-size:13px;color:#4d5a70">Si usted no la pidió, ignore este mensaje: su contraseña actual sigue funcionando.</p>
                  </td></tr>
                  <tr><td style="padding:8px 32px 28px;font-size:12px;color:#8593a8">¿Necesita ayuda? Soporte: %s</td></tr>
                </table>
                </body></html>
                """.formatted(name, HtmlUtils.htmlEscape(temporaryPassword), properties.tempPasswordHours(), url, phone);
    }

    private static String maskForLog(String email) {
        int at = email.indexOf('@');
        return at <= 1 ? "***" : email.charAt(0) + "***" + email.substring(at);
    }
}
