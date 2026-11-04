'use client';

import type { AjustesAll } from '@/lib/ajustes';
import { guardarAjustes } from '../../actions';
import { Formulario } from '../Formulario';

export function FormAjustes({ a }: { a: AjustesAll }) {
  return (
    <Formulario accion={guardarAjustes} boton="Guardar ajustes">
      <div className="card" style={{ marginBottom: 20 }}>
        <fieldset className="fs"><h3>Contacto</h3>
          <div className="row2">
            <div className="f"><label htmlFor="whatsapp">WhatsApp (con código de país)</label><input id="whatsapp" name="whatsapp" defaultValue={a.whatsapp} placeholder="5491164627064" /></div>
            <div className="f"><label htmlFor="instagram">Usuario de Instagram</label><input id="instagram" name="instagram" defaultValue={a.instagram} placeholder="modaconsteph" /><small>Si lo dejás vacío, el botón no aparece.</small></div>
          </div>
          <div className="f"><label htmlFor="link_resena">Link para dejar reseñas en Google</label><input id="link_resena" name="link_resena" defaultValue={a.link_resena} /></div>
          <div className="f"><label htmlFor="direccion_estudio">Dirección exacta del estudio</label><input id="direccion_estudio" name="direccion_estudio" defaultValue={a.direccion_estudio} /><small>No se publica en la web: llega a la alumna el mismo día de la clase.</small></div>
        </fieldset>
        <fieldset className="fs"><h3>Mails</h3>
          <div className="row3">
            <div className="f"><label htmlFor="mail_steph">Tu email para recibir avisos</label><input id="mail_steph" name="mail_steph" type="email" defaultValue={a.mail_steph} /><small>Ahí te llega cada reserva y cada consulta nueva.</small></div>
            <div className="f"><label htmlFor="remitente_nombre">Nombre que ve la alumna</label><input id="remitente_nombre" name="remitente_nombre" defaultValue={a.remitente_nombre} /></div>
            <div className="f"><label htmlFor="remitente_email">Desde qué email salen</label><input id="remitente_email" name="remitente_email" type="email" defaultValue={a.remitente_email} placeholder="hola@modaconsteph.com.ar" /><small>Tiene que ser una dirección de tu dominio, verificada con quien administra la web.</small></div>
          </div>
        </fieldset>
        <fieldset className="fs"><h3>Transferencia bancaria</h3><small>Se le muestran a la alumna que elige transferir.</small>
          <div className="row3">
            <div className="f"><label htmlFor="t_titular">Titular</label><input id="t_titular" name="t_titular" defaultValue={a.transferencia.titular} /></div>
            <div className="f"><label htmlFor="t_cuit">CUIT / CUIL</label><input id="t_cuit" name="t_cuit" defaultValue={a.transferencia.cuit} /></div>
            <div className="f"><label htmlFor="t_banco">Banco</label><input id="t_banco" name="t_banco" defaultValue={a.transferencia.banco} /></div>
          </div>
          <div className="row2">
            <div className="f"><label htmlFor="t_cbu">CBU</label><input id="t_cbu" name="t_cbu" defaultValue={a.transferencia.cbu} /></div>
            <div className="f"><label htmlFor="t_alias">Alias</label><input id="t_alias" name="t_alias" defaultValue={a.transferencia.alias} /></div>
          </div>
        </fieldset>
        <fieldset className="fs"><h3>Pago desde el exterior</h3>
          <div className="f"><label htmlFor="ex_instrucciones">Instrucciones para la alumna</label><textarea id="ex_instrucciones" name="ex_instrucciones" defaultValue={a.exterior.instrucciones} placeholder="Ej.: Pagá por PayPal al link de abajo y mandanos el comprobante." /></div>
          <div className="f"><label htmlFor="ex_link">Link de pago (PayPal u otro)</label><input id="ex_link" name="ex_link" defaultValue={a.exterior.link} /></div>
        </fieldset>
        <fieldset className="fs"><h3>Reglas de reserva</h3>
          <div className="row2">
            <div className="f"><label htmlFor="hold_horas">Horas que se guarda el lugar si elige transferencia</label><input id="hold_horas" name="hold_horas" type="number" min={1} max={168} defaultValue={a.hold_horas} /></div>
            <div className="f"><label htmlFor="mp_hold_min">Minutos que se guarda el lugar mientras paga con Mercado Pago</label><input id="mp_hold_min" name="mp_hold_min" type="number" min={15} max={240} defaultValue={a.mp_hold_min} /></div>
          </div>
          <div className="f"><label htmlFor="politica_cambios">Política de cambios y cancelaciones</label><textarea id="politica_cambios" name="politica_cambios" defaultValue={a.politica_cambios} /><small>Se muestra antes de pagar, en las preguntas frecuentes y en la ficha de cada curso.</small></div>
        </fieldset>
      </div>
    </Formulario>
  );
}
