package net.flxia.portal.config;

import java.nio.charset.StandardCharsets;
import java.util.regex.Pattern;

/**
 * Shapes and limits of everything that comes from the browser. The same numbers
 * live in {@code frontend/src/utilidades/caracteres.js} (LIMITS).
 */
public final class FormatoEntrada {

    public static final int IDENTIFICATION_MAX = 13;
    public static final int SEARCH_MAX = 60;
    public static final int NAME_MIN = 3;
    public static final int NAME_MAX = 200;
    public static final int PASSWORD_MIN = 8;
    public static final int PASSWORD_MAX = 64;
    /** bcrypt only looks at the first 72 bytes; longer secrets are refused, not silently cut. */
    private static final int PASSWORD_MAX_BYTES = 72;

    public static final String FINAL_CONSUMER = "9999999999999";

    private static final Pattern DIGITS = Pattern.compile("^[0-9]+$");
    private static final Pattern ACCESS_KEY = Pattern.compile("^[0-9]{49}$");
    private static final Pattern INSTANCE_CODE = Pattern.compile("^[a-z0-9-]{2,30}$");
    private static final Pattern EMAIL = Pattern.compile(
            "^[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(\\.[A-Za-z0-9-]+)*\\.[A-Za-z]{2,}$");
    /** Control and invisible format characters. */
    private static final Pattern INVISIBLE = Pattern.compile("[\\p{Cc}\\p{Cf}\\p{Zl}\\p{Zp}]");
    private static final Pattern SPACES = Pattern.compile("\\s+");

    public static final String IDENTIFICATION_MESSAGE =
            "Ingrese una cédula (10 dígitos) o un RUC (13 dígitos) válido.";

    private FormatoEntrada() {
    }

    // ------------------------------------------------------------------
    //  Cédula / RUC
    // ------------------------------------------------------------------

    /**
     * Ecuadorian cédula (10 digits, check digit) or RUC (13 digits). Never the
     * final consumer 9999999999999.
     *
     * <p>RUCs of companies (third digit 6 or 9) are checked by structure only: the
     * SRI has issued valid RUCs that fail the old modulo 11 check, and rejecting a
     * real customer is worse than letting a typo reach the "not found" message.
     */
    public static boolean isValidIdentification(String value) {
        if (value == null || !DIGITS.matcher(value).matches()) {
            return false;
        }
        if (value.length() == 10) {
            return isValidCedula(value);
        }
        if (value.length() == 13) {
            return !FINAL_CONSUMER.equals(value) && isValidRuc(value);
        }
        return false;
    }

    static boolean isValidCedula(String value) {
        if (value.length() != 10 || !validProvince(value)) {
            return false;
        }
        int third = value.charAt(2) - '0';
        if (third >= 6) {
            return false;
        }
        int sum = 0;
        for (int i = 0; i < 9; i++) {
            int digit = value.charAt(i) - '0';
            if (i % 2 == 0) {
                digit *= 2;
                if (digit > 9) {
                    digit -= 9;
                }
            }
            sum += digit;
        }
        int check = (10 - sum % 10) % 10;
        return check == value.charAt(9) - '0';
    }

    static boolean isValidRuc(String value) {
        if (value.length() != 13 || !validProvince(value) || value.endsWith("000")) {
            return false;
        }
        int third = value.charAt(2) - '0';
        if (third < 6) {
            // Natural person: cédula + establishment number.
            return isValidCedula(value.substring(0, 10));
        }
        return third == 6 || third == 9;
    }

    /** Provinces 01 to 24, and 30 for foreigners. */
    private static boolean validProvince(String value) {
        int province = Integer.parseInt(value.substring(0, 2));
        return (province >= 1 && province <= 24) || province == 30;
    }

    /** Strips spaces and keeps the value only if it is made of digits (else returns it unchanged for the 400). */
    public static String normalizeIdentification(String raw) {
        return raw == null ? "" : SPACES.matcher(raw).replaceAll("");
    }

    // ------------------------------------------------------------------
    //  Text fields
    // ------------------------------------------------------------------

    /** Search text without control characters or forbidden symbols, trimmed and capped. */
    public static String cleanSearch(String text) {
        return clean(text, SEARCH_MAX);
    }

    /**
     * Name copied from an invoice when the account is created: the ERP allows
     * symbols such as "&" that the portal's own name field does not, so the same
     * cleaning applies ("A & B S.A." becomes "A B S.A.").
     */
    public static String cleanImportedName(String text) {
        return clean(text, NAME_MAX);
    }

    private static String clean(String text, int max) {
        if (text == null) {
            return "";
        }
        String clean = CaracteresProhibidos.replaceWithSpaces(INVISIBLE.matcher(text).replaceAll(" "));
        clean = SPACES.matcher(clean).replaceAll(" ").strip();
        if (clean.codePointCount(0, clean.length()) > max) {
            clean = clean.substring(0, clean.offsetByCodePoints(0, max)).strip();
        }
        return clean;
    }

    /** Null when the name is acceptable, otherwise the message for the 400. */
    public static String checkName(String name) {
        if (name == null || name.isBlank()) {
            return "Ingrese su nombre completo.";
        }
        if (INVISIBLE.matcher(name).find()) {
            return "El nombre tiene caracteres no válidos.";
        }
        if (CaracteresProhibidos.containsAny(name)) {
            return "El nombre" + CaracteresProhibidos.MESSAGE_SUFFIX + ".";
        }
        int length = name.strip().codePointCount(0, name.strip().length());
        if (length < NAME_MIN) {
            return "El nombre debe tener al menos " + NAME_MIN + " caracteres.";
        }
        if (length > NAME_MAX) {
            return "El nombre no puede pasar de " + NAME_MAX + " caracteres.";
        }
        if (name.codePoints().noneMatch(Character::isLetter)) {
            return "El nombre debe tener letras.";
        }
        return null;
    }

    /**
     * Null when the new password is acceptable, otherwise the message for the 400.
     *
     * <p>Exception to the forbidden-characters rule: symbols are allowed (they make
     * the password stronger and it is only stored as a bcrypt hash). Control
     * characters and spaces are not.
     */
    public static String checkPassword(String password, String identification) {
        if (password == null || password.isEmpty()) {
            return "Ingrese la nueva contraseña.";
        }
        if (INVISIBLE.matcher(password).find() || password.codePoints().anyMatch(Character::isWhitespace)) {
            return "La contraseña no puede tener espacios ni caracteres invisibles.";
        }
        int length = password.codePointCount(0, password.length());
        if (length < PASSWORD_MIN) {
            return "La contraseña debe tener al menos " + PASSWORD_MIN + " caracteres.";
        }
        if (length > PASSWORD_MAX || password.getBytes(StandardCharsets.UTF_8).length > PASSWORD_MAX_BYTES) {
            return "La contraseña no puede pasar de " + PASSWORD_MAX + " caracteres.";
        }
        if (password.equals(identification)) {
            return "La nueva contraseña no puede ser su cédula o RUC.";
        }
        return null;
    }

    /** A password typed at login: anything longer than the limit cannot be right. */
    public static boolean isPlausiblePassword(String password) {
        return password != null && !password.isEmpty()
                && password.length() <= PASSWORD_MAX * 2
                && password.getBytes(StandardCharsets.UTF_8).length <= PASSWORD_MAX_BYTES;
    }

    // ------------------------------------------------------------------
    //  Identifiers in URLs and data from the ERP
    // ------------------------------------------------------------------

    public static boolean isAccessKey(String value) {
        return value != null && ACCESS_KEY.matcher(value).matches();
    }

    public static boolean isInstanceCode(String value) {
        return value != null && INSTANCE_CODE.matcher(value).matches();
    }

    /**
     * Domains that can never receive mail (RFC 2606 / 6761): an invoice typed
     * with "cliente@prueba.local" must not swallow the temporary password.
     */
    private static final Pattern UNDELIVERABLE_DOMAIN = Pattern.compile(
            "(?i).*@(.+\\.)?(local|localhost|test|example|invalid|lan|internal)$"
                    + "|(?i).*@(.+\\.)?example\\.(com|net|org)$");

    /** The e-mail stored on an invoice, if it looks deliverable; otherwise null. */
    public static String usableEmail(String value) {
        if (value == null) {
            return null;
        }
        String email = value.strip();
        if (email.length() > 150 || !EMAIL.matcher(email).matches() || UNDELIVERABLE_DOMAIN.matcher(email).matches()) {
            return null;
        }
        return email;
    }

    /** "cristian@gmail.com" → "cr******@gmail.com". */
    public static String maskEmail(String email) {
        if (email == null) {
            return null;
        }
        int at = email.indexOf('@');
        if (at <= 0) {
            return null;
        }
        String local = email.substring(0, at);
        int visible = local.length() <= 3 ? 1 : 2;
        return local.substring(0, visible) + "*".repeat(Math.max(3, local.length() - visible)) + email.substring(at);
    }
}
