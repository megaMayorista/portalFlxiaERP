package net.flxia.portal.comprobantes;

import java.time.LocalDateTime;

/**
 * What the ERP instances know about an identification: whether it has any
 * authorized document, the name on the latest one and the latest usable e-mail.
 */
public record DatosCliente(
        boolean hasDocuments,
        String name,
        LocalDateTime nameDate,
        String email,
        LocalDateTime emailDate) {

    public static final DatosCliente NONE = new DatosCliente(false, null, null, null, null);

    /** Keeps the most recent name and the most recent e-mail of the two. */
    public DatosCliente merge(DatosCliente other) {
        if (other == null || !other.hasDocuments) {
            return this;
        }
        if (!hasDocuments) {
            return other;
        }
        boolean otherName = other.nameDate != null && (nameDate == null || other.nameDate.isAfter(nameDate));
        boolean otherEmail = other.email != null
                && (email == null || (other.emailDate != null && (emailDate == null || other.emailDate.isAfter(emailDate))));
        return new DatosCliente(true,
                otherName ? other.name : name,
                otherName ? other.nameDate : nameDate,
                otherEmail ? other.email : email,
                otherEmail ? other.emailDate : emailDate);
    }
}
