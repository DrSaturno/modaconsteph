'use client';

import { guardarFecha } from '../../actions';
import { Formulario } from '../Formulario';
import { CamposFecha, type FechaEdit } from './CamposFecha';

export function FormFecha({ cursoId, tipo, kind, valores }: { cursoId: string; tipo: string; kind: string; valores: FechaEdit }) {
  return (
    <Formulario accion={guardarFecha} boton={valores.id ? 'Guardar esta fecha' : 'Agregar fecha'}>
      <input type="hidden" name="curso_id" value={cursoId} />
      {valores.id && <input type="hidden" name="fecha_id" value={valores.id} />}
      <CamposFecha v={valores} tipo={tipo} kind={kind} conPrecio nuevo={!valores.id} />
    </Formulario>
  );
}
