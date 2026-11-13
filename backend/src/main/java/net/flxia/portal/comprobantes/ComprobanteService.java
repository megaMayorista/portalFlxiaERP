package net.flxia.portal.comprobantes;

import net.flxia.portal.config.ErrorPortal;
import net.flxia.portal.config.FormatoEntrada;
import net.flxia.portal.instancias.InstanciaERP;
import net.flxia.portal.instancias.RegistroInstancias;
import net.flxia.portal.instancias.ResultadoParalelo;
import org.springframework.dao.DataAccessException;
import org.springframework.stereotype.Service;

import java.text.Normalizer;
import java.time.LocalDate;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.regex.Pattern;

/**
 * Documents of one identification across every ERP instance. The listing is
 * small (the biggest customer has about a hundred documents), so filtering,
 * sorting and paging happen here after one indexed query per instance.
 */
@Service
public class ComprobanteService {

    public static final int MAX_PAGE_SIZE = 50;
    private static final Pattern ACCENTS = Pattern.compile("\\p{M}+");
    private static final Pattern NON_DIGITS = Pattern.compile("[^0-9]");

    private final RegistroInstancias registry;
    private final ConsultasERP queries;

    public ComprobanteService(RegistroInstancias registry, ConsultasERP queries) {
        this.registry = registry;
        this.queries = queries;
    }

    public enum Filtro { ALL, INVOICE, CREDIT_NOTE }

    public PaginaComprobantesDTO list(String identification, Filtro type, String search,
                                      LocalDate from, LocalDate to, int page, int size) {
        boolean invoices = type == Filtro.ALL || type == Filtro.INVOICE;
        boolean creditNotes = type == Filtro.ALL || type == Filtro.CREDIT_NOTE;

        ResultadoParalelo<List<ComprobanteDTO>> result =
                registry.queryAll(instance -> queries.list(instance, identification, invoices, creditNotes));

        String term = normalize(FormatoEntrada.cleanSearch(search));
        String termDigits = NON_DIGITS.matcher(term).replaceAll("");
        List<ComprobanteDTO> all = result.values().stream()
                .flatMap(List::stream)
                .filter(doc -> matchesDates(doc, from, to))
                .filter(doc -> term.isEmpty() || matchesSearch(doc, term, termDigits))
                .sorted(Comparator.comparing(ComprobanteDTO::issueDate, Comparator.nullsLast(Comparator.reverseOrder()))
                        .thenComparing(ComprobanteDTO::number, Comparator.nullsLast(Comparator.reverseOrder())))
                .toList();

        int pageSize = Math.min(Math.max(size, 1), MAX_PAGE_SIZE);
        int totalPages = Math.max(1, (all.size() + pageSize - 1) / pageSize);
        int current = Math.min(Math.max(page, 1), totalPages);
        int start = (current - 1) * pageSize;
        List<ComprobanteDTO> items = all.subList(Math.min(start, all.size()), Math.min(start + pageSize, all.size()));

        return new PaginaComprobantesDTO(items, all.size(), current, pageSize, totalPages, result.unavailable());
    }

    private static boolean matchesDates(ComprobanteDTO doc, LocalDate from, LocalDate to) {
        if (doc.issueDate() == null) {
            return from == null && to == null;
        }
        LocalDate day = doc.issueDate().toLocalDate();
        return (from == null || !day.isBefore(from)) && (to == null || !day.isAfter(to));
    }

    /** Number (with or without dashes), access key, issuer RUC or issuer name; accents ignored. */
    private static boolean matchesSearch(ComprobanteDTO doc, String term, String termDigits) {
        if (contains(doc.number(), term) || contains(doc.accessKey(), term)
                || contains(doc.issuerRuc(), term) || contains(doc.issuerName(), term)) {
            return true;
        }
        return termDigits.length() >= 3 && doc.number() != null
                && NON_DIGITS.matcher(doc.number()).replaceAll("").contains(termDigits);
    }

    private static boolean contains(String value, String term) {
        return value != null && normalize(value).contains(term);
    }

    private static String normalize(String text) {
        if (text == null) {
            return "";
        }
        return ACCENTS.matcher(Normalizer.normalize(text, Normalizer.Form.NFD)).replaceAll("")
                .toLowerCase(Locale.ROOT).strip();
    }

    /**
     * One file, re-authorized against the session's identification. A document of
     * someone else answers exactly like one that does not exist.
     */
    public ArchivoComprobante file(String identification, String instanceCode, String typeUrl,
                                   String accessKey, boolean pdf) {
        if (!FormatoEntrada.isInstanceCode(instanceCode) || !FormatoEntrada.isAccessKey(accessKey)) {
            throw ErrorPortal.notFound("No encontramos ese comprobante.");
        }
        TipoComprobante type = TipoComprobante.fromUrl(typeUrl)
                .orElseThrow(() -> ErrorPortal.notFound("No encontramos ese comprobante."));
        InstanciaERP instance = registry.find(instanceCode)
                .orElseThrow(() -> ErrorPortal.notFound("No encontramos ese comprobante."));
        Optional<ArchivoComprobante> file;
        try {
            file = queries.file(instance, type, accessKey, identification, pdf);
        } catch (DataAccessException ex) {
            throw ErrorPortal.unavailable("El emisor de este comprobante no responde en este momento. "
                    + "Inténtelo de nuevo en unos minutos.");
        }
        ArchivoComprobante found = file.orElseThrow(() -> ErrorPortal.notFound("No encontramos ese comprobante."));
        if (found.content() == null || found.content().length == 0) {
            throw ErrorPortal.notFound(pdf
                    ? "Este comprobante no tiene el PDF disponible. Pídalo al emisor."
                    : "Este comprobante no tiene el XML disponible. Pídalo al emisor.");
        }
        return found;
    }

    /** What the instances know about an identification (first entry, recovery, profile). */
    public ResultadoParalelo<DatosCliente> customer(String identification) {
        return registry.queryAll(instance -> queries.customer(instance, identification));
    }

    public static DatosCliente merge(ResultadoParalelo<DatosCliente> result) {
        DatosCliente merged = DatosCliente.NONE;
        for (DatosCliente data : result.values()) {
            merged = merged.merge(data);
        }
        return merged;
    }
}
