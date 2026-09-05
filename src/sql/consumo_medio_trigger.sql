-- ============================================================
-- FUNCTION: Calcula media movel de consumo (ultimos 6 meses)
-- Mes corrente excluido - usa apenas meses fechados
-- Atualiza automaticamente materias_primas.consumo_medio_mensal
-- ============================================================

CREATE OR REPLACE FUNCTION atualizar_consumo_medio()
RETURNS TRIGGER AS $$
DECLARE
    mp_id INTEGER;
    media_calc NUMERIC(12,3);
BEGIN
    mp_id := COALESCE(NEW.materia_prima_id, OLD.materia_prima_id);

    SELECT
        ROUND(AVG(consumo), 3)
    INTO media_calc
    FROM vw_consumo_mensal
    WHERE materia_prima_id = mp_id
      AND mes >= date_trunc('month', CURRENT_DATE) - INTERVAL '6 months'
      AND mes <  date_trunc('month', CURRENT_DATE);

    IF media_calc IS NOT NULL THEN
        UPDATE materias_primas
        SET consumo_medio_mensal = media_calc
        WHERE id = mp_id;
    END IF;

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- TRIGGER: Dispara apos INSERT/UPDATE/DELETE em historico_consumo
-- ============================================================

CREATE TRIGGER trg_atualizar_consumo_medio
    AFTER INSERT OR UPDATE OR DELETE
    ON historico_consumo
    FOR EACH ROW
    EXECUTE FUNCTION atualizar_consumo_medio();
