// Edad en años cumplidos a partir de una fecha 'YYYY-MM-DD' (la que guarda DATEONLY).
export const calcularEdad = (fechaISO, hoy = new Date()) => {
  const [anio, mes, dia] = String(fechaISO).slice(0, 10).split('-').map(Number);
  if (!anio || !mes || !dia) return null;

  let edad = hoy.getUTCFullYear() - anio;
  const antesDelCumple =
    hoy.getUTCMonth() + 1 < mes || (hoy.getUTCMonth() + 1 === mes && hoy.getUTCDate() < dia);
  if (antesDelCumple) edad -= 1;
  return edad;
};

// Mismo rango que valida el formulario de registro (src/pages/Register.jsx)
export const EDAD_MIN = 18;
export const EDAD_MAX = 90;
export const edadPermitida = (fechaISO) => {
  const edad = calcularEdad(fechaISO);
  return edad !== null && edad >= EDAD_MIN && edad <= EDAD_MAX;
};
