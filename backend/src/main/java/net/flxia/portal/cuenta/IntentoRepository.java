package net.flxia.portal.cuenta;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

/** portal.auth_attempts: the memory of the attempt limits. */
@Repository
public class IntentoRepository {

    public static final String LOGIN = "LOGIN";
    public static final String RECOVERY = "RECOVERY";

    private final JdbcTemplate jdbc;

    public IntentoRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    /** success is stored as 1 (succeeded) or 0 (failed). */
    public void record(String kind, String identification, String ip, boolean success) {
        jdbc.update("INSERT INTO portal.auth_attempts (kind, identification, ip_address, success) VALUES (?, ?, ?, ?)",
                kind, identification, ip, success ? 1 : 0);
    }

    /** Failed logins of an identification in the window, counting only after its last successful one. */
    public int failedLoginsOf(String identification, int windowMinutes) {
        Integer count = jdbc.queryForObject(
                "SELECT count(*) FROM portal.auth_attempts"
                        + " WHERE identification = ? AND kind = 'LOGIN' AND success = 0"
                        + " AND created_at > GREATEST(now() - make_interval(mins => ?),"
                        + "   COALESCE((SELECT max(created_at) FROM portal.auth_attempts"
                        + "             WHERE identification = ? AND kind = 'LOGIN' AND success = 1), '-infinity'))",
                Integer.class, identification, windowMinutes, identification);
        return count == null ? 0 : count;
    }

    public int failedLoginsFromIp(String ip, int windowMinutes) {
        Integer count = jdbc.queryForObject(
                "SELECT count(*) FROM portal.auth_attempts WHERE ip_address = ? AND kind = 'LOGIN' AND success = 0"
                        + " AND created_at > now() - make_interval(mins => ?)",
                Integer.class, ip, windowMinutes);
        return count == null ? 0 : count;
    }

    public int recoveriesOf(String identification, int windowMinutes) {
        Integer count = jdbc.queryForObject(
                "SELECT count(*) FROM portal.auth_attempts WHERE identification = ? AND kind = 'RECOVERY'"
                        + " AND created_at > now() - make_interval(mins => ?)",
                Integer.class, identification, windowMinutes);
        return count == null ? 0 : count;
    }

    public int recoveriesFromIp(String ip, int windowMinutes) {
        Integer count = jdbc.queryForObject(
                "SELECT count(*) FROM portal.auth_attempts WHERE ip_address = ? AND kind = 'RECOVERY'"
                        + " AND created_at > now() - make_interval(mins => ?)",
                Integer.class, ip, windowMinutes);
        return count == null ? 0 : count;
    }

    public int deleteOlderThanDays(int days) {
        return jdbc.update("DELETE FROM portal.auth_attempts WHERE created_at < now() - make_interval(days => ?)", days);
    }
}
