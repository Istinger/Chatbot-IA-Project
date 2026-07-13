/**
 * Interfaz JobSource. Toda fuente implementa exactamente esto:
 *
 *   fetchJobs(query) -> RawJob[]     // formato propio de la fuente
 *   normalize(RawJob) -> Job         // esquema comun (modelo Job de Prisma)
 *
 * Agregar una fuente nueva = crear un archivo aqui y anadirlo a este mapa.
 * Nada mas en el sistema necesita enterarse.
 */
const adzuna = require('./adzuna');
const jooble = require('./jooble');
const arbeitnow = require('./arbeitnow');

const SOURCES = { adzuna, jooble, arbeitnow };

module.exports = { SOURCES, adzuna, jooble, arbeitnow };
