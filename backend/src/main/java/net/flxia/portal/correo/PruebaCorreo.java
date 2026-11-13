package net.flxia.portal.correo;

import net.flxia.portal.config.FormatoEntrada;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.context.ConfigurableApplicationContext;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * Sends the test e-mail and exits, without touching any customer:
 *
 * <pre>
 * docker compose run --rm --no-deps backend --spring.main.web-application-type=none --enviar-correo-prueba=alguien@gmail.com
 * </pre>
 *
 * It runs in its own short-lived container (the portal keeps serving) with the
 * same .env, so it proves that PORTAL_MAIL_USERNAME / PORTAL_MAIL_PASSWORD work
 * and shows exactly the e-mail customers receive.
 */
@Component
public class PruebaCorreo implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(PruebaCorreo.class);
    private static final String OPTION = "enviar-correo-prueba";

    private final CorreoService mail;
    private final ConfigurableApplicationContext context;

    public PruebaCorreo(CorreoService mail, ConfigurableApplicationContext context) {
        this.mail = mail;
        this.context = context;
    }

    @Override
    public void run(ApplicationArguments args) {
        if (!args.containsOption(OPTION)) {
            return;
        }
        List<String> values = args.getOptionValues(OPTION);
        String to = values == null || values.isEmpty() ? null : FormatoEntrada.usableEmail(values.get(0));
        int code;
        if (to == null) {
            log.error("--{}=<correo>: falta un correo válido", OPTION);
            code = 2;
        } else {
            try {
                mail.sendTest(to);
                log.info("CORREO DE PRUEBA ENVIADO a {}. Revise la bandeja de entrada (y spam).", to);
                code = 0;
            } catch (RuntimeException ex) {
                log.error("EL CORREO DE PRUEBA NO SALIÓ: {}", ex.getMessage());
                code = 1;
            }
        }
        int exitCode = code;
        System.exit(SpringApplication.exit(context, () -> exitCode));
    }
}
