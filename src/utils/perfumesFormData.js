export function aFormData(datos, archivo) {
  const { id, imagen, acordes, ...resto } = datos;
  const fd = new FormData();
  Object.entries(resto).forEach(([k, v]) => fd.append(k, v));
  fd.append('acordes', JSON.stringify(acordes ?? []));
  if (archivo) fd.append('imagen', archivo);   // archivo: se sube
  else fd.append('imagen', imagen ?? '');      // sin archivo: va la URL
  return fd;
}