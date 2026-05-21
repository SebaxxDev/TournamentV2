-- Agrega campo orden a poker_nivel para preservar el orden real de niveles y breaks.
-- Los nuevos torneos guardarán el índice real de cada nivel en este campo.
-- Para registros existentes se inicializa con el id_nivel relativo dentro de cada poker,
-- ya que no es posible recuperar el orden original si los breaks estaban con numero_nivel = 0.
ALTER TABLE "poker_nivel" ADD COLUMN "orden" INTEGER NOT NULL DEFAULT 0;

UPDATE "poker_nivel" pn
SET "orden" = subq.fila - 1
FROM (
  SELECT id_nivel,
         ROW_NUMBER() OVER (PARTITION BY id_poker ORDER BY id_nivel ASC) AS fila
  FROM "poker_nivel"
) subq
WHERE pn.id_nivel = subq.id_nivel;
