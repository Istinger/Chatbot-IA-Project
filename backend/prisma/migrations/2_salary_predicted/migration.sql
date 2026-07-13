-- Adzuna marca algunos salarios con `salary_is_predicted`: son ESTIMACIONES
-- suyas, no cifras publicadas por la empresa. Se notaba en los 32 clones del
-- mismo puesto remoto de GovCIO, cada uno con un salario distinto ($100k, $154k,
-- $169k...) porque Adzuna lo estimaba por ciudad.
--
-- Mostrar una estimacion como si fuera el sueldo real, en una feature que se
-- llama "cuanto te van a pagar", seria enganar al usuario. Este flag permite que
-- la UI lo diga: "~$110k (estimado)".

ALTER TABLE "Job" ADD COLUMN "salaryPredicted" BOOLEAN NOT NULL DEFAULT false;
