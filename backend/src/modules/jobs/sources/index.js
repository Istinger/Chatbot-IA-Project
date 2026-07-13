/**
 * Interfaz JobSource. Toda fuente implementa exactamente esto:
 *
 *   fetchJobs(query) -> RawJob[]     // formato propio de la fuente
 *   normalize(RawJob) -> Job         // esquema comun (modelo Job de Prisma)
 *
 * Agregar una fuente nueva = crear un archivo aqui y anadirlo a este mapa.
 * Nada mas en el sistema necesita enterarse. (remoteok se sumo asi, en minutos.)
 */
const adzuna = require('./adzuna');
const jooble = require('./jooble');
const arbeitnow = require('./arbeitnow');
const remoteok = require('./remoteok');

const SOURCES = { adzuna, jooble, arbeitnow, remoteok };

module.exports = { SOURCES, adzuna, jooble, arbeitnow, remoteok };
