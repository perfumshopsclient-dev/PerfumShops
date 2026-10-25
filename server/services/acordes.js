import { Acorde } from '../models/Acorde.js';

// ["Floral ", "floral", "Vainilla"] -> ["floral", "vainilla"]
export const normalizarAcordes = (lista = []) => [
  ...new Set(lista.map((a) => String(a).trim().toLowerCase()).filter(Boolean)),
];

export async function resolverAcordes(nombres, transaction) {
  if (!nombres.length) return [];
  await Acorde.bulkCreate(
    nombres.map((nombre) => ({ nombre })),
    { ignoreDuplicates: true, transaction },
  );
  return Acorde.findAll({ where: { nombre: nombres }, transaction });
}

export async function asignarAcordes(perfume, nombres, transaction) {
  const acordes = await resolverAcordes(normalizarAcordes(nombres), transaction);
  await perfume.setAcordes(acordes, { transaction });
}

export const incluirAcordes = () => ({
  model: Acorde,
  as: 'acordes',
  attributes: ['nombre'],
  through: { attributes: [] },
});

// Mantiene el contrato con el frontend: acordes sigue siendo un arreglo de strings.
export function perfumeADTO(perfume) {
  const json = perfume.toJSON();
  json.acordes = (json.acordes ?? []).map((a) => a.nombre).sort();
  return json;
}

// GET /acordes -> ["amaderado", "floral", ...] (para las sugerencias del dashboard)
export async function listarNombresAcordes() {
  const filas = await Acorde.findAll({ attributes: ['nombre'], order: [['nombre', 'ASC']] });
  return filas.map((a) => a.nombre);
}
