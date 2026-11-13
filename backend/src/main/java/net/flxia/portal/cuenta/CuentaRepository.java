package net.flxia.portal.cuenta;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/** portal.accounts. */
@Repository
public class CuentaRepository {

    private static final String SELECT =
            "SELECT account_id, identification, full_name, password_hash, using_default_password,"
                    + " temp_password_hash, (temp_password_hash IS NOT NULL AND temp_password_expires_at > now()),"
                    + " must_change_password FROM portal.accounts";

    private final JdbcTemplate jdbc;

    public CuentaRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public Optional<Cuenta> findByIdentification(String identification) {
        return first(jdbc.query(SELECT + " WHERE identification = ?", (rs, row) -> map(rs), identification));
    }

    public Optional<Cuenta> findById(long accountId) {
        return first(jdbc.query(SELECT + " WHERE account_id = ?", (rs, row) -> map(rs), accountId));
    }

    /** Creates the account with the identification as password; does nothing if it already exists. */
    public void createIfMissing(String identification, String fullName, String passwordHash) {
        jdbc.update("INSERT INTO portal.accounts (identification, full_name, password_hash, using_default_password)"
                        + " VALUES (?, ?, ?, TRUE) ON CONFLICT (identification) DO NOTHING",
                identification, fullName, passwordHash);
    }

    /**
     * Entering with the temporary password forces a change; entering with the
     * normal one (the person remembered it after all) does not.
     */
    public void recordLogin(long accountId, boolean withTemporaryPassword) {
        jdbc.update("UPDATE portal.accounts SET last_login_at = now(), must_change_password = ? WHERE account_id = ?",
                withTemporaryPassword, accountId);
    }

    /** E-mail recovery: the normal password keeps working until the temporary one is used and replaced. */
    public void setTemporaryPassword(long accountId, String tempHash, int validHours) {
        jdbc.update("UPDATE portal.accounts SET temp_password_hash = ?,"
                        + " temp_password_expires_at = now() + make_interval(hours => ?), updated_at = now()"
                        + " WHERE account_id = ?",
                tempHash, validHours, accountId);
    }

    /** Recovery without e-mail: the password goes back to the identification. */
    public void resetToIdentification(long accountId, String identificationHash) {
        jdbc.update("UPDATE portal.accounts SET password_hash = ?, using_default_password = TRUE,"
                        + " temp_password_hash = NULL, temp_password_expires_at = NULL,"
                        + " must_change_password = FALSE, updated_at = now() WHERE account_id = ?",
                identificationHash, accountId);
    }

    public void changePassword(long accountId, String newHash) {
        jdbc.update("UPDATE portal.accounts SET password_hash = ?, using_default_password = FALSE,"
                        + " temp_password_hash = NULL, temp_password_expires_at = NULL,"
                        + " must_change_password = FALSE, updated_at = now() WHERE account_id = ?",
                newHash, accountId);
    }

    public void changeName(long accountId, String fullName) {
        jdbc.update("UPDATE portal.accounts SET full_name = ?, updated_at = now() WHERE account_id = ?",
                fullName, accountId);
    }

    private static Optional<Cuenta> first(List<Cuenta> rows) {
        return rows.stream().findFirst();
    }

    private static Cuenta map(java.sql.ResultSet rs) throws java.sql.SQLException {
        return new Cuenta(rs.getLong(1), rs.getString(2), rs.getString(3), rs.getString(4), rs.getBoolean(5),
                rs.getString(6), rs.getBoolean(7), rs.getBoolean(8));
    }
}
