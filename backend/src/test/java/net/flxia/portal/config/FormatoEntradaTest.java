package net.flxia.portal.config;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

class FormatoEntradaTest {

    @Test
    void cedulaWithRightCheckDigit() {
        assertTrue(FormatoEntrada.isValidIdentification("1710034065"));
        assertFalse(FormatoEntrada.isValidIdentification("1710034064"));
    }

    @Test
    void cedulaShapeRules() {
        assertFalse(FormatoEntrada.isValidIdentification("2510034065"), "province 25 does not exist");
        assertFalse(FormatoEntrada.isValidIdentification("1770034065"), "third digit must be below 6");
        assertFalse(FormatoEntrada.isValidIdentification("171003406"), "nine digits");
        assertFalse(FormatoEntrada.isValidIdentification("17100340-5"), "not only digits");
        assertFalse(FormatoEntrada.isValidIdentification(null));
    }

    @Test
    void rucOfPersonAndCompanies() {
        assertTrue(FormatoEntrada.isValidIdentification("1710034065001"));
        assertFalse(FormatoEntrada.isValidIdentification("1710034064001"), "person RUC carries the cédula check");
        assertTrue(FormatoEntrada.isValidIdentification("1790012345001"), "private company, structure only");
        assertTrue(FormatoEntrada.isValidIdentification("1760001550001"), "public entity, structure only");
        assertFalse(FormatoEntrada.isValidIdentification("1790012345000"), "establishment 000");
        assertFalse(FormatoEntrada.isValidIdentification("1780012345001"), "third digit 8");
    }

    @Test
    void finalConsumerIsNeverAccepted() {
        assertFalse(FormatoEntrada.isValidIdentification("9999999999999"));
    }

    @Test
    void importedNamesLoseForbiddenSymbols() {
        assertEquals("A B S.A.", FormatoEntrada.cleanImportedName("A & B S.A."));
        assertEquals("JUAN PEREZ", FormatoEntrada.cleanImportedName("  JUAN   PEREZ  "));
    }

    @Test
    void nameRules() {
        assertNull(FormatoEntrada.checkName("María José Pérez"));
        assertNotNull(FormatoEntrada.checkName("Pérez & Hijos"));
        assertNotNull(FormatoEntrada.checkName("ab"));
        assertNotNull(FormatoEntrada.checkName("12345"));
    }

    @Test
    void passwordAcceptsSymbolsButNotSpacesOrTheIdentification() {
        assertNull(FormatoEntrada.checkPassword("Clave#2026!", "1710034065"));
        assertNotNull(FormatoEntrada.checkPassword("corta1", "1710034065"));
        assertNotNull(FormatoEntrada.checkPassword("con espacio 1", "1710034065"));
        assertNotNull(FormatoEntrada.checkPassword("1710034065", "1710034065"));
        assertNotNull(FormatoEntrada.checkPassword("x".repeat(65), "1710034065"));
    }

    @Test
    void searchIsCleanedAndCapped() {
        assertEquals("001-011", FormatoEntrada.cleanSearch("001-011;"));
        assertEquals(60, FormatoEntrada.cleanSearch("9".repeat(80)).length());
    }

    @Test
    void emailMasking() {
        assertEquals("cr******@gmail.com", FormatoEntrada.maskEmail("cristian@gmail.com"));
        assertEquals("a***@x.ec", FormatoEntrada.maskEmail("ab@x.ec"));
        assertNull(FormatoEntrada.usableEmail("sin correo"));
        assertEquals("ana@mail.com", FormatoEntrada.usableEmail(" ana@mail.com "));
    }
}
