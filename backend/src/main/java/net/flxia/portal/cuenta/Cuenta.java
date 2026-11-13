package net.flxia.portal.cuenta;

/** A row of portal.accounts, with the temporary password's validity already evaluated by the database. */
public record Cuenta(
        long accountId,
        String identification,
        String fullName,
        String passwordHash,
        boolean usingDefaultPassword,
        String tempPasswordHash,
        boolean tempPasswordValid,
        boolean mustChangePassword) {
}
