package net.flxia.portal.cuenta;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

/** portal.download_log: every PDF / XML handed out. */
@Repository
public class DescargaRepository {

    private final JdbcTemplate jdbc;

    public DescargaRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public void record(long accountId, String instanceCode, String documentType, String accessKey,
                       String fileFormat, String ip) {
        jdbc.update("INSERT INTO portal.download_log (account_id, instance_code, document_type, access_key, file_format, ip_address)"
                        + " VALUES (?, ?, ?, ?, ?, ?)",
                accountId, instanceCode, documentType, accessKey, fileFormat, ip);
    }
}
