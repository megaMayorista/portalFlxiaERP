package net.flxia.portal.sesion;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/** portal.sessions: one row per open session; the token itself is never stored. */
@Repository
public class SesionRepository {

    private final JdbcTemplate jdbc;

    public SesionRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public void create(String tokenHash, long accountId, int maxHours, String ip, String userAgent) {
        jdbc.update("INSERT INTO portal.sessions (token_hash, account_id, expires_at, ip_address, user_agent)"
                        + " VALUES (?, ?, now() + make_interval(hours => ?), ?, ?)",
                tokenHash, accountId, maxHours, ip, userAgent);
    }

    /**
     * The session behind a token if it is still alive: not past its absolute
     * expiry and used within the idle window. Touches last_seen_at at most once a
     * minute, so browsing does not write on every request.
     */
    public Optional<SesionActual> findActive(String tokenHash, int idleMinutes) {
        List<Object[]> rows = jdbc.query(
                "SELECT s.session_id, a.account_id, a.identification, a.full_name,"
                        + " a.must_change_password, a.using_default_password,"
                        + " (s.last_seen_at < now() - interval '1 minute') AS needs_touch"
                        + " FROM portal.sessions s JOIN portal.accounts a ON a.account_id = s.account_id"
                        + " WHERE s.token_hash = ? AND s.expires_at > now()"
                        + " AND s.last_seen_at > now() - make_interval(mins => ?)",
                (rs, row) -> new Object[]{
                        new SesionActual(rs.getLong(1), rs.getLong(2), rs.getString(3), rs.getString(4),
                                rs.getBoolean(5), rs.getBoolean(6)),
                        rs.getBoolean(7)},
                tokenHash, idleMinutes);
        if (rows.isEmpty()) {
            return Optional.empty();
        }
        SesionActual session = (SesionActual) rows.get(0)[0];
        if ((Boolean) rows.get(0)[1]) {
            jdbc.update("UPDATE portal.sessions SET last_seen_at = now() WHERE session_id = ?", session.sessionId());
        }
        return Optional.of(session);
    }

    public void delete(long sessionId) {
        jdbc.update("DELETE FROM portal.sessions WHERE session_id = ?", sessionId);
    }

    public void deleteAllOf(long accountId) {
        jdbc.update("DELETE FROM portal.sessions WHERE account_id = ?", accountId);
    }

    public void deleteOthersOf(long accountId, long keepSessionId) {
        jdbc.update("DELETE FROM portal.sessions WHERE account_id = ? AND session_id <> ?", accountId, keepSessionId);
    }

    public int deleteExpired(int idleMinutes) {
        return jdbc.update("DELETE FROM portal.sessions WHERE expires_at <= now()"
                + " OR last_seen_at <= now() - make_interval(mins => ?)", idleMinutes);
    }
}
