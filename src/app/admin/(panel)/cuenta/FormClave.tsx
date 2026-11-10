'use client';

import { cambiarMiClave } from '../../actions';
import { Formulario } from '../Formulario';

export function FormClave() {
  return (
    <Formulario accion={cambiarMiClave} boton="Cambiar mi clave">
      <div className="card" style={{ marginBottom: 20, maxWidth: 520 }}>
        <fieldset className="fs"><h3>Cambiar mi clave</h3>
          <div className="f"><label htmlFor="actual">Clave actual</label><input id="actual" name="actual" type="password" autoComplete="current-password" required /></div>
          <div className="f"><label htmlFor="nueva">Clave nueva</label><input id="nueva" name="nueva" type="password" autoComplete="new-password" minLength={10} required /><small>Al menos 10 caracteres. Una frase larga que te acuerdes es mejor que una palabra con números.</small></div>
          <div className="f"><label htmlFor="repetir">Repetí la clave nueva</label><input id="repetir" name="repetir" type="password" autoComplete="new-password" minLength={10} required /></div>
        </fieldset>
      </div>
    </Formulario>
  );
}
