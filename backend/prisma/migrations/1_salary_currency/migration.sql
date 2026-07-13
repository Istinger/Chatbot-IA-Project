-- Adzuna devuelve el salario en la MONEDA LOCAL del pais (MXN en Mexico, EUR en
-- Espana, GBP en Reino Unido...). Sin esta informacion, comparar salaryMax entre
-- paises era comparar peras con manzanas: una oferta mexicana de 1.080.000 MXN
-- (~63k USD) parecia pagar 4x mas que una estadounidense de 276.013 USD.
--
-- salaryMin/salaryMax: se conservan tal como los publica la fuente (moneda original).
-- salaryUsdMin/Max:    equivalente anual en USD -> el unico campo comparable.

ALTER TABLE "Job" ADD COLUMN "currency" TEXT;
ALTER TABLE "Job" ADD COLUMN "salaryUsdMin" DOUBLE PRECISION;
ALTER TABLE "Job" ADD COLUMN "salaryUsdMax" DOUBLE PRECISION;

-- Ordenar/filtrar por sueldo es una operacion frecuente (exploracion del
-- epsilon-greedy, listados "mejor pagadas").
CREATE INDEX "Job_salaryUsdMax_idx" ON "Job"("salaryUsdMax");
