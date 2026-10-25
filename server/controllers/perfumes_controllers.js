import { sequelize } from '../db/database.js';
import { asignarAcordes, incluirAcordes, perfumeADTO } from '../services/acordes.js';
import { subirImagen } from '../services/cloudinary.js';
import { Op } from 'sequelize';
import { createHash } from 'node:crypto';
import { MOMENTOS, CLIMAS } from '../models/perfumeEnums.js';

const CAMPOS_NUMERICOS = ['ml', 'precio_unitario', 'stock_minimo', 'cantidad'];


async function resolverImagen(req, actual = null) {
  if (req.file) {
    const { url } = await subirImagen(req.file.buffer);
    return url;
  }
  const url = req.body.imagen;
  if (url === undefined) return actual;
  const limpia = String(url).trim();
  if (!limpia) return null;
  if (!/^https?:\/\//i.test(limpia)) {
    throw Object.assign(new Error('La imagen debe ser una URL que empiece por http:// o https://.'), { status: 400 });
  }
  return limpia;
}

// El frontend manda multipart/form-data: todo llega como string y "acordes" como JSON.
// undefined -> no vino (en PUT significa "no tocar los acordes"); null -> formato inválido.
function leerAcordes(raw) {
  if (raw === undefined) return undefined;
  if (Array.isArray(raw)) return raw;
  try {
    const valor = JSON.parse(raw);
    return Array.isArray(valor) ? valor : null;
  } catch {
    return null;
  }
}

// Lista blanca de campos: NUNCA se toma el id (ni nada más) del body.
// Si quieres guardar "descripcion", agrégala aquí Y en el modelo/tabla.
function leerDatos(body) {
  const datos = {};
  if (body.nombre !== undefined) datos.nombre = String(body.nombre).trim();
  if (body.genre !== undefined) datos.genre = body.genre;
  for (const campo of CAMPOS_NUMERICOS) {
    if (body[campo] !== undefined && body[campo] !== '') datos[campo] = Number(body[campo]);
  }

  for (const [campo, validos] of [['momento', MOMENTOS], ['clima', CLIMAS]]) {
    if (body[campo] === undefined) continue;
    if (!validos.includes(body[campo])) {
      throw Object.assign(new Error(`Valor no válido para ${campo}.`), { status: 400 });
    }
    datos[campo] = body[campo];
  }
  return datos;
}

const obtener = (perfumeModel, id) => perfumeModel.findByPk(id, { include: incluirAcordes() });

function manejarError(e, res, next) {
  if (e.name === 'SequelizeValidationError') {
    return res.status(400).json({ message: e.errors[0].message });
  }
  if (e.parent?.code === '23514') { // check_violation de Postgres
    return res.status(400).json({ message: 'Valores fuera de rango (revisa stock, precio y ml).' });
  }
  if (e.parent?.code === '22P02') { // texto con formato inválido (uuid, enum...)
    return res.status(400).json({ message: 'Alguno de los datos enviados no tiene un formato válido.' });
  }

  if (e.status === 400) return res.status(400).json({ message: e.message });
  return next(e);
}

export class PerfumeController {
  constructor({ perfumeModel }) {
    this.perfumeModel = perfumeModel;
  }

  getAll = async (req, res) => {
    const perfumes = await this.perfumeModel.findAll();
    res.json(perfumes);
  }

  listar = async (_req, res, next) => {
    try {
      const perfumes = await this.perfumeModel.findAll({
        include: incluirAcordes(),
        order: [['createdAt', 'DESC']],
      });
      res.json(perfumes.map(perfumeADTO));
    } catch (e) {
      manejarError(e, res, next);
    }
  };

  crear = async (req, res, next) => {
    try {
      const acordes = leerAcordes(req.body.acordes);
      if (acordes === null) {
        return res.status(400).json({ message: 'El formato de los acordes no es válido.' });
      }
      const datos = { ...leerDatos(req.body), imagen: await resolverImagen(req) };

      // Perfume + sus acordes en una sola transacción: o se guarda todo o nada.
      const id = await sequelize.transaction(async (t) => {
        const p = await this.perfumeModel.create(datos, { transaction: t });
        await asignarAcordes(p, acordes ?? [], t);
        return p.id;
      });

      // Se vuelve a leer con los acordes incluidos para responder igual que el GET.
      console.log('Perfume creado:');
      res.status(201).json(perfumeADTO(await obtener(this.perfumeModel, id)));
    } catch (e) {
      manejarError(e, res, next);
    }
  };

  actualizar = async (req, res, next) => {

    try {
      const perfume = await this.perfumeModel.findByPk(req.params.id);
      if (!perfume) return res.status(404).json({ message: 'Perfume no encontrado.' });

      const acordes = leerAcordes(req.body.acordes);
      if (acordes === null) {
        return res.status(400).json({ message: 'El formato de los acordes no es válido.' });
      }
      const datos = { ...leerDatos(req.body), imagen: await resolverImagen(req, perfume.imagen) };

      perfume.set(datos);
      await sequelize.transaction(async (t) => {
      await perfume.update(datos, { transaction: t });
      console.log('update ok');
      if (acordes !== undefined) await asignarAcordes(perfume, acordes, t);
      console.log('acordes ok');
    });
    console.log('commit ok');

      res.json(perfumeADTO(await obtener(this.perfumeModel, perfume.id)));
    } catch (e) {
      manejarError(e, res, next);
    }
  };

  eliminar = async (req, res, next) => {
    try {
      const perfume = await this.perfumeModel.findByPk(req.params.id);
      if (!perfume) return res.status(404).json({ message: 'Perfume no encontrado.' });
      await perfume.destroy(); // paranoid: solo marca deletedAt, no borra la fila
      console.log('Perfume eliminado:', perfume.id);
      res.status(204).end();
    } catch (e) {
      manejarError(e, res, next);
    }
  };

  obtenerPorId = async (req, res, next) => {
    try {
      const perfume = await obtener(this.perfumeModel, req.params.id);
      if (!perfume) return res.status(404).json({ message: 'Perfume no encontrado.' });
      res.json(perfumeADTO(perfume));
    } catch (e) {
      manejarError(e, res, next);
    }
  };

  seleccion = async (req, res, next) => {
    try {
      const { momento } = req.query;
      if (momento !== 'día' && momento !== 'noche') {
        return res.status(400).json({ message: "momento debe ser 'día' o 'noche'." });
      }
      const perfumes = await this.perfumeModel.findAll({
        where: { momento: { [Op.in]: [momento, 'día y noche'] }, cantidad: { [Op.gt]: 0 } },
        include: incluirAcordes(),
      });

      // Orden estable durante el día; cambia al día siguiente sin guardar nada
      const semilla = new Date().toISOString().slice(0, 10);
      const orden = (p) => createHash('sha1').update(`${semilla}${momento}${p.id}`).digest('hex');
      const elegidos = perfumes.sort((a, b) => orden(a).localeCompare(orden(b))).slice(0, 4);

      res.set('Cache-Control', 'public, max-age=300');
      res.json(elegidos.map((p) => {
        const { id, nombre, genre, imagen, acordes } = perfumeADTO(p);
        return { id, nombre, genero: genre, imagen, acordes }; // mismo formato que /ventas/mas-vendidas
      }));
    } catch (e) {
      manejarError(e, res, next);
    }
  };
}