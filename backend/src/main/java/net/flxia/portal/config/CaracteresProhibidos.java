package net.flxia.portal.config;

/**
 * Symbols the portal never accepts in text typed by people (name, search):
 * * / = ¿ ? ( ) \ & % $ # ! ¡ ° | ; : quotes ¬ ` < >.
 *
 * <p>The frontend already stops them while typing; this is the server side of the
 * same rule, so a request crafted by hand is rejected (400) and a search simply
 * ignores them. Keep it in sync with {@code frontend/src/utilidades/caracteres.js}.
 *
 * <p>Passwords are the one exception (see {@link FormatoEntrada#checkPassword}):
 * symbols make them stronger and they never reach a document, an XML or a query,
 * because only their bcrypt hash is stored.
 */
public final class CaracteresProhibidos {

    public static final String LIST = "*/=¿?()\\&%$#!¡°|;:\"'“”‘’¬`<>";

    public static final String MESSAGE_SUFFIX =
            " no puede llevar símbolos como * / = ¿ ? ( ) & % # ! ¡ ° | ; : ni comillas";

    private CaracteresProhibidos() {
    }

    public static boolean isForbidden(int codePoint) {
        return LIST.indexOf(codePoint) >= 0;
    }

    public static boolean containsAny(String text) {
        return text != null && text.codePoints().anyMatch(CaracteresProhibidos::isForbidden);
    }

    /** Every forbidden character becomes a space (used to clean search text and imported names). */
    public static String replaceWithSpaces(String text) {
        if (text == null || text.isEmpty()) {
            return text;
        }
        StringBuilder clean = new StringBuilder(text.length());
        text.codePoints().forEach(codePoint -> {
            if (isForbidden(codePoint)) {
                clean.append(' ');
            } else {
                clean.appendCodePoint(codePoint);
            }
        });
        return clean.toString();
    }
}
