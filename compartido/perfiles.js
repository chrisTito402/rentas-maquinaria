export const perfiles = {
  admin: 'Administrador',
  auxiliar: 'Auxiliar comercial',
  operador: 'Personal de operaciones',
  consulta: 'Solo consulta',
};

export const puedeOperar = rol => rol === 'admin' || rol === 'operador';
export const puedeCapturarCotizacion = rol => rol === 'admin' || rol === 'auxiliar';
