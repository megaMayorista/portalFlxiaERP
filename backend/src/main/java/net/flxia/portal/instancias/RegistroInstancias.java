package net.flxia.portal.instancias;

import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;
import jakarta.annotation.PreDestroy;
import net.flxia.portal.config.FormatoEntrada;
import net.flxia.portal.config.PropiedadesPortal;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.TimeoutException;
import java.util.function.Function;

/**
 * The ERP instances listed in config/instancias.yml. Adding one is adding an
 * entry and restarting the backend: no code changes.
 *
 * <p>Every lookup goes to all instances at the same time (virtual threads) with a
 * total time limit. An instance that is down or slow is reported as unavailable
 * and the answer is built with the others, so one broken instance never takes
 * the portal down.
 */
@Component
public class RegistroInstancias {

    private static final Logger log = LoggerFactory.getLogger(RegistroInstancias.class);

    private final Map<String, InstanciaERP> instances = new LinkedHashMap<>();
    private final ExecutorService executor = Executors.newVirtualThreadPerTaskExecutor();
    private final long timeoutMs;

    public RegistroInstancias(PropiedadesPortal properties) {
        this.timeoutMs = properties.instanceTimeoutMs();
        boolean local = !properties.cookieSecure();
        for (PropiedadesPortal.Instancia config : properties.instances()) {
            if (!config.isEnabled()) {
                log.info("ERP instance {} is disabled in the configuration", config.code());
                continue;
            }
            validate(config);
            boolean testMode = config.wantsTestMode() && local;
            if (config.wantsTestMode() && !local) {
                log.error("ERP instance {} asks for test-mode, IGNORED: it is only allowed when the portal runs locally (http)",
                        config.code());
            } else if (testMode) {
                log.warn("ERP instance {} in TEST MODE: it also shows documents NOT authorized by the SRI (local only)",
                        config.code());
            }
            instances.put(config.code(), new InstanciaERP(config.code(), config.name(),
                    config.environments() == null || config.environments().isEmpty() ? List.of(2) : config.environments(),
                    testMode, pool(config)));
            log.info("ERP instance registered: {} ({})", config.code(), config.name());
        }
        if (instances.isEmpty()) {
            log.warn("No ERP instances configured: check config/instancias.yml");
        }
    }

    private static void validate(PropiedadesPortal.Instancia config) {
        if (!FormatoEntrada.isInstanceCode(config.code())) {
            throw new IllegalStateException("Invalid instance code (lowercase, digits, dashes): " + config.code());
        }
        if (config.jdbcUrl() == null || !config.jdbcUrl().startsWith("jdbc:postgresql://")) {
            throw new IllegalStateException("Instance " + config.code() + " needs a jdbc:postgresql:// URL");
        }
        if (config.name() == null || config.name().isBlank()) {
            throw new IllegalStateException("Instance " + config.code() + " needs a name");
        }
        if (config.environments() != null
                && config.environments().stream().anyMatch(env -> env == null || (env != 1 && env != 2))) {
            throw new IllegalStateException("Instance " + config.code() + ": environments only accepts 1 and 2");
        }
    }

    private static HikariDataSource pool(PropiedadesPortal.Instancia config) {
        HikariConfig hikari = new HikariConfig();
        hikari.setPoolName("erp-" + config.code());
        hikari.setJdbcUrl(config.jdbcUrl());
        hikari.setUsername(config.username());
        hikari.setPassword(config.password());
        hikari.setReadOnly(true);
        hikari.setAutoCommit(true);
        // Small and idle-friendly: the ERP's own backend must never feel the portal.
        hikari.setMaximumPoolSize(4);
        hikari.setMinimumIdle(0);
        hikari.setIdleTimeout(120_000);
        hikari.setMaxLifetime(900_000);
        hikari.setConnectionTimeout(4_000);
        // Start even if the instance is down; it is retried on each request.
        hikari.setInitializationFailTimeout(-1);
        hikari.setConnectionInitSql("SET statement_timeout = '8s'");
        hikari.addDataSourceProperty("ApplicationName", "portal-flxia");
        hikari.addDataSourceProperty("connectTimeout", "4");
        hikari.addDataSourceProperty("socketTimeout", "30");
        return new HikariDataSource(hikari);
    }

    public List<InstanciaERP> all() {
        return List.copyOf(instances.values());
    }

    public Optional<InstanciaERP> find(String code) {
        return Optional.ofNullable(instances.get(code));
    }

    /**
     * Runs {@code query} on every instance in parallel and waits at most the
     * configured time for all of them together.
     */
    public <T> ResultadoParalelo<T> queryAll(Function<InstanciaERP, T> query) {
        List<InstanciaERP> targets = all();
        List<Future<T>> futures = new ArrayList<>(targets.size());
        for (InstanciaERP instance : targets) {
            futures.add(executor.submit(() -> query.apply(instance)));
        }

        long deadline = System.nanoTime() + TimeUnit.MILLISECONDS.toNanos(timeoutMs);
        List<T> values = new ArrayList<>(targets.size());
        List<String> unavailable = new ArrayList<>();
        for (int i = 0; i < targets.size(); i++) {
            InstanciaERP instance = targets.get(i);
            Future<T> future = futures.get(i);
            try {
                long remaining = Math.max(0, deadline - System.nanoTime());
                values.add(future.get(remaining, TimeUnit.NANOSECONDS));
            } catch (TimeoutException ex) {
                future.cancel(true);
                log.warn("ERP instance {} did not answer in {} ms", instance.code(), timeoutMs);
                unavailable.add(instance.name());
            } catch (ExecutionException ex) {
                log.warn("ERP instance {} failed: {}", instance.code(), rootMessage(ex));
                unavailable.add(instance.name());
            } catch (InterruptedException ex) {
                Thread.currentThread().interrupt();
                unavailable.add(instance.name());
            }
        }
        return new ResultadoParalelo<>(values, unavailable);
    }

    private static String rootMessage(Throwable ex) {
        Throwable root = ex;
        while (root.getCause() != null && root.getCause() != root) {
            root = root.getCause();
        }
        return root.getClass().getSimpleName() + ": " + root.getMessage();
    }

    @PreDestroy
    void shutdown() {
        executor.shutdownNow();
        instances.values().forEach(InstanciaERP::close);
    }
}
