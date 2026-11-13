package net.flxia.portal.comprobantes;

/** A RIDE (PDF) or authorized XML, exactly as the ERP stored it. */
public record ArchivoComprobante(byte[] content, String number) {
}
