'use client';

import { useActionState, useTransition } from 'react';
import { entrar } from '../actions';

export function FormularioLogin() {
  const [estado, enviar, pendiente] = useActionState(entrar, { error: '', email: '' });
  const [, empezar] = useTransition();
  return (
    <form onSubmit={(ev) => { ev.preventDefault(); const d = new FormData(ev.currentTarget); empezar(() => enviar(d)); }}>
      <h1>Panel de Steph</h1>
      <p>Entrá con tu email y tu clave.</p>
      {estado.error && <p className="msg err" role="alert">{estado.error}</p>}
      <div className="f"><label htmlFor="email">Email</label><input id="email" name="email" type="email" autoComplete="username" defaultValue={estado.email} required /></div>
      <div className="f"><label htmlFor="clave">Clave</label><input id="clave" name="clave" type="password" autoComplete="current-password" required /></div>
      <button className="btn" type="submit" disabled={pendiente} style={{ width: '100%' }}>{pendiente ? 'Entrando…' : 'Entrar'}</button>
    </form>
  );
}
