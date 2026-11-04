'use client';

import { guardarPlantilla } from '../../actions';
import { Formulario } from '../Formulario';

export function FormPlantilla({ clave, asunto, cuerpo }: { clave: string; asunto: string; cuerpo: string }) {
  return (
    <Formulario accion={guardarPlantilla} boton="Guardar texto">
      <input type="hidden" name="clave" value={clave} />
      <div className="f"><label htmlFor={`a-${clave}`}>Asunto</label><input id={`a-${clave}`} name="asunto" defaultValue={asunto} required /></div>
      <div className="f"><label htmlFor={`c-${clave}`}>Texto</label><textarea id={`c-${clave}`} name="cuerpo" defaultValue={cuerpo} rows={10} required /></div>
    </Formulario>
  );
}
