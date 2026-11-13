package net.flxia.portal.comprobantes;

import jakarta.servlet.http.HttpServletRequest;
import net.flxia.portal.config.ClienteIp;
import net.flxia.portal.config.ErrorPortal;
import net.flxia.portal.cuenta.DescargaRepository;
import net.flxia.portal.sesion.SesionActual;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.format.DateTimeParseException;
import java.util.Locale;

/** /api/documents: "Mis comprobantes" and the PDF / XML downloads. */
@RestController
@RequestMapping("/api/documents")
public class ComprobanteController {

    private final ComprobanteService service;
    private final DescargaRepository downloads;

    public ComprobanteController(ComprobanteService service, DescargaRepository downloads) {
        this.service = service;
        this.downloads = downloads;
    }

    @GetMapping(produces = MediaType.APPLICATION_JSON_VALUE)
    public PaginaComprobantesDTO list(SesionActual session,
                                      @RequestParam(defaultValue = "ALL") String type,
                                      @RequestParam(defaultValue = "") String search,
                                      @RequestParam(required = false) String from,
                                      @RequestParam(required = false) String to,
                                      @RequestParam(defaultValue = "1") int page,
                                      @RequestParam(defaultValue = "30") int size) {
        ComprobanteService.Filtro filter;
        try {
            filter = ComprobanteService.Filtro.valueOf(type.toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException ex) {
            throw ErrorPortal.badRequest("El tipo de comprobante no es válido.");
        }
        LocalDate fromDate = date(from);
        LocalDate toDate = date(to);
        if (fromDate != null && toDate != null && fromDate.isAfter(toDate)) {
            throw ErrorPortal.badRequest("La fecha \"desde\" no puede ser posterior a la fecha \"hasta\".");
        }
        if (search.length() > 200) {
            throw ErrorPortal.badRequest("La búsqueda es demasiado larga.");
        }
        return service.list(session.identification(), filter, search, fromDate, toDate, page, size);
    }

    /** Dates come from a date picker as AAAA-MM-DD; anything else is a 400. */
    private static LocalDate date(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        if (value.length() != 10) {
            throw ErrorPortal.badRequest("Las fechas deben tener el formato AAAA-MM-DD.");
        }
        try {
            return LocalDate.parse(value);
        } catch (DateTimeParseException ex) {
            throw ErrorPortal.badRequest("Las fechas deben tener el formato AAAA-MM-DD.");
        }
    }

    @GetMapping("/{instanceCode}/{type}/{accessKey}/{format}")
    public ResponseEntity<byte[]> download(SesionActual session,
                                           @PathVariable String instanceCode,
                                           @PathVariable String type,
                                           @PathVariable String accessKey,
                                           @PathVariable String format,
                                           HttpServletRequest request) {
        boolean pdf = "pdf".equals(format);
        if (!pdf && !"xml".equals(format)) {
            throw ErrorPortal.notFound("No encontramos ese comprobante.");
        }
        ArchivoComprobante file = service.file(session.identification(), instanceCode, type, accessKey, pdf);
        TipoComprobante documentType = TipoComprobante.fromUrl(type).orElseThrow();
        downloads.record(session.accountId(), instanceCode, documentType.name(), accessKey,
                pdf ? "PDF" : "XML", ClienteIp.of(request));

        String number = file.number() == null ? accessKey : file.number().replaceAll("[^0-9-]", "");
        String fileName = documentType.filePrefix() + "_" + number + (pdf ? ".pdf" : ".xml");
        return ResponseEntity.ok()
                .contentType(pdf ? MediaType.APPLICATION_PDF : new MediaType("application", "xml", StandardCharsets.UTF_8))
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        ContentDisposition.attachment().filename(fileName, StandardCharsets.UTF_8).build().toString())
                .contentLength(file.content().length)
                .body(file.content());
    }
}
