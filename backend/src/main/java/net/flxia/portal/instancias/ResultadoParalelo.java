package net.flxia.portal.instancias;

import java.util.List;

/**
 * What came back from a lookup on all instances: the answers of the ones that
 * replied and the names of the ones that did not.
 */
public record ResultadoParalelo<T>(List<T> values, List<String> unavailable) {

    public boolean partial() {
        return !unavailable.isEmpty();
    }
}
