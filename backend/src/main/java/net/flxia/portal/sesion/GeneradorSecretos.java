package net.flxia.portal.sesion;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.util.Base64;
import java.util.HexFormat;

/** Session tokens and temporary passwords. */
public final class GeneradorSecretos {

    private static final SecureRandom RANDOM = new SecureRandom();
    /** No 0/O, 1/l/I: the temporary password is read from an e-mail and typed by hand. */
    private static final String TEMP_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
    private static final int TEMP_LENGTH = 10;

    private GeneradorSecretos() {
    }

    /** 256 random bits, URL-safe. Only its SHA-256 is stored. */
    public static String sessionToken() {
        byte[] bytes = new byte[32];
        RANDOM.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    public static String temporaryPassword() {
        StringBuilder password = new StringBuilder(TEMP_LENGTH);
        for (int i = 0; i < TEMP_LENGTH; i++) {
            password.append(TEMP_ALPHABET.charAt(RANDOM.nextInt(TEMP_ALPHABET.length())));
        }
        return password.toString();
    }

    public static String sha256(String value) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            return HexFormat.of().formatHex(digest.digest(value.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException ex) {
            throw new IllegalStateException("SHA-256 not available", ex);
        }
    }
}
