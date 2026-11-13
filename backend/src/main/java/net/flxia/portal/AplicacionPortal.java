package net.flxia.portal;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * Download portal for FluxoERP customers (www.portal.flxia.net).
 *
 * <p>Customers enter with their cédula or RUC and download the RIDE (PDF) and the
 * authorized XML of every electronic document issued to them by any business that
 * runs FluxoERP. The documents are read live, read-only, from each ERP instance's
 * database; the portal's own database only keeps accounts, sessions, attempts and
 * the download log.
 */
@SpringBootApplication
@ConfigurationPropertiesScan
@EnableScheduling
public class AplicacionPortal {

    public static void main(String[] args) {
        SpringApplication.run(AplicacionPortal.class, args);
    }
}
