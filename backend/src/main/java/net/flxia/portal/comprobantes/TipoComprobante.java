package net.flxia.portal.comprobantes;

import java.util.Locale;
import java.util.Optional;

/** Kinds of electronic documents the portal shows. */
public enum TipoComprobante {

    INVOICE("FACTURA"),
    CREDIT_NOTE("NOTA_CREDITO");

    /** Prefix of the downloaded file name: FACTURA_001-011-000006430.pdf */
    private final String filePrefix;

    TipoComprobante(String filePrefix) {
        this.filePrefix = filePrefix;
    }

    public String filePrefix() {
        return filePrefix;
    }

    /** "invoice" / "credit-note" as they appear in download URLs. */
    public String urlValue() {
        return name().toLowerCase(Locale.ROOT).replace('_', '-');
    }

    public static Optional<TipoComprobante> fromUrl(String value) {
        for (TipoComprobante type : values()) {
            if (type.urlValue().equals(value)) {
                return Optional.of(type);
            }
        }
        return Optional.empty();
    }
}
