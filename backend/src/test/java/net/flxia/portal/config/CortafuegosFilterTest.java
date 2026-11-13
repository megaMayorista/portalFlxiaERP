package net.flxia.portal.config;

import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;

import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;

class CortafuegosFilterTest {

    private static MockHttpServletRequest request(String uri, String query) {
        MockHttpServletRequest request = new MockHttpServletRequest("GET", uri);
        request.setQueryString(query);
        return request;
    }

    @Test
    void normalRequestsPass() {
        assertNull(CortafuegosFilter.check(request("/api/documents", "type=ALL&page=1&size=30")));
        assertNull(CortafuegosFilter.check(request("/api/documents", "type=INVOICE&page=2&size=30&search=12-11-2026")));
        assertNull(CortafuegosFilter.check(request("/api/documents", "search=PABLO%20DAVID%20LOPEZ")));
        assertNull(CortafuegosFilter.check(request("/api/documents", "search=001-002-000001159")));
        assertNull(CortafuegosFilter.check(request("/api/documents", "search=Comercial%20Union%20Selecta")));
        assertNull(CortafuegosFilter.check(request(
                "/api/documents/megamayorista/invoice/1311202601100368872600120010120000004217958173519/pdf", null)));
        assertNull(CortafuegosFilter.check(request("/api/auth/session", null)));
    }

    @Test
    void sqlInjectionIsBlocked() {
        assertNotNull(CortafuegosFilter.check(request("/api/documents", "search=1%20UNION%20SELECT%20password%20FROM%20x")));
        assertNotNull(CortafuegosFilter.check(request("/api/documents", "search=1%27%20or%201%3D1")));
        assertNotNull(CortafuegosFilter.check(request("/api/documents", "search=1;%20DROP%20TABLE%20x")));
        assertNotNull(CortafuegosFilter.check(request("/api/documents", "search=pg_sleep(5)")));
        assertNotNull(CortafuegosFilter.check(request("/api/documents", "search=information_schema.tables")));
    }

    @Test
    void xssIsBlocked() {
        assertNotNull(CortafuegosFilter.check(request("/api/documents", "search=%3Cscript%3Ealert(1)%3C/script%3E")));
        assertNotNull(CortafuegosFilter.check(request("/api/documents", "search=%3Cimg%20src%3Dx%20onerror%3Dalert(1)%3E")));
        assertNotNull(CortafuegosFilter.check(request("/api/documents", "search=javascript:alert(1)")));
    }

    @Test
    void pathTricksAreBlocked() {
        assertNotNull(CortafuegosFilter.check(request("/api/documents/../auth/session", null)));
        assertNotNull(CortafuegosFilter.check(request("/api/documents/%2e%2e/x", null)));
        assertNotNull(CortafuegosFilter.check(request("/api//documents", null)));
        assertNotNull(CortafuegosFilter.check(request("/api/documents;jsessionid=1", null)));
        assertNotNull(CortafuegosFilter.check(request("/api/documents", "search=%24%7Bjndi:ldap://x%7D")));
        assertNotNull(CortafuegosFilter.check(request("/api/documents", "search=..%2F..%2Fetc%2Fpasswd")));
        assertNotNull(CortafuegosFilter.check(request("/api/" + "a".repeat(600), null)));
    }
}
