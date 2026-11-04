export type FechaEdit = {
  id?: string; edicion: string; fecha: string; hora: string; cupo: number; otras: string; fin: string; repite: string;
  precio: number | null; lista: number | null; hasta: string; link: string; direccion: string; estado: string; publicarEn: string;
};

export const FECHA_VACIA: FechaEdit = {
  edicion: '', fecha: '', hora: '', cupo: 4, otras: '', fin: '', repite: 'no', precio: null, lista: null, hasta: '', link: '', direccion: '', estado: 'abierta', publicarEn: '',
};

/** Los campos de una fecha: se usan al cargar un curso nuevo y al agregar o editar una fecha de un curso. */
export function CamposFecha({ v, tipo, kind, conPrecio, nuevo, conPublicacion = true }: { v: FechaEdit; tipo: string; kind: string; conPrecio: boolean; nuevo: boolean; conPublicacion?: boolean }) {
  return (
    <>
      <div className="row3">
        <div className="f"><label htmlFor="fecha">Fecha</label><input id="fecha" name="fecha" type="date" defaultValue={v.fecha} required /></div>
        <div className="f"><label htmlFor="hora">Horario</label><input id="hora" name="hora" defaultValue={v.hora} placeholder="11:00 a 13:30" required /></div>
        {kind === 'slot'
          ? <div className="f"><label>Lugares</label><input value="1 (turno individual)" disabled readOnly /></div>
          : <div className="f"><label htmlFor="cupo">Lugares</label><input id="cupo" name="cupo" type="number" min={1} defaultValue={v.cupo} required /></div>}
      </div>
      {kind !== 'slot' && (
        <div className="row2">
          <div className="f"><label htmlFor="otras_clases">Otras clases del mismo curso</label>
            <input id="otras_clases" name="otras_clases" defaultValue={v.otras} placeholder="Ej.: 14, 16 y 21 de diciembre" />
            <small>Si el curso tiene varias clases, anotalas acá. Se muestran junto con la primera fecha.</small></div>
          <div className="f"><label htmlFor="fin_fecha">Última clase</label>
            <input id="fin_fecha" name="fin_fecha" type="date" defaultValue={v.fin} />
            <small>Solo si hay varias clases: con esto sale el mail de reseña un día después.</small></div>
        </div>
      )}
      <div className="row2">
        <div className="f"><label htmlFor="edicion">Nombre de la edición (opcional)</label>
          <input id="edicion" name="edicion" defaultValue={v.edicion} placeholder="Ej.: Edición diciembre" /></div>
        <div className="f"><label htmlFor="repite">¿Se repite?</label>
          <select id="repite" name="repite" defaultValue={v.repite}>
            <option value="no">No, es una sola fecha</option><option value="mensual">Todos los meses</option><option value="quincenal">Cada 2 semanas</option></select>
          <small>Con "Todos los meses", la fecha siguiente se abre sola cuando esta termina. Si tiene varias clases, queda en borrador para que cargues sus días.</small></div>
      </div>
      {tipo === 'online' && <div className="f"><label htmlFor="link_online">Link de la clase</label><input id="link_online" name="link_online" defaultValue={v.link} placeholder="https://zoom.us/j/…" /><small>Le llega a la alumna el mismo día de la clase.</small></div>}
      {tipo !== 'online' && <div className="f"><label htmlFor="direccion">Dirección de esta fecha (opcional)</label><input id="direccion" name="direccion" defaultValue={v.direccion} placeholder="Si lo dejás vacío se usa la del estudio" /></div>}
      {conPrecio && (
        <>
          <div className="row3">
            <div className="f"><label htmlFor="fecha_precio_lista">Precio de lista de esta fecha ($)</label><input id="fecha_precio_lista" name="fecha_precio_lista" type="number" min={0} defaultValue={v.lista ?? ''} /></div>
            <div className="f"><label htmlFor="fecha_precio">Precio actual de esta fecha ($)</label><input id="fecha_precio" name="fecha_precio" type="number" min={0} defaultValue={v.precio ?? ''} /></div>
            <div className="f"><label htmlFor="precio_hasta">Precio vigente hasta</label><input id="precio_hasta" name="precio_hasta" type="date" defaultValue={v.hasta} /></div>
          </div>
          <small style={{ display: 'block', marginBottom: 14, color: 'var(--muted)' }}>Opcional. Si lo dejás vacío, rige el precio del curso.</small>
        </>
      )}
      {conPublicacion && <fieldset className="f" style={{ border: 0, padding: 0 }}>
        <legend>Publicación</legend>
        <label className="chk"><input type="radio" name="publicacion" value="ahora" defaultChecked={v.estado === 'abierta' || nuevo} /><span>Publicar ahora: ya se puede reservar en la web</span></label>
        <label className="chk"><input type="radio" name="publicacion" value="borrador" defaultChecked={!nuevo && v.estado === 'borrador' && !v.publicarEn} /><span>Guardar como borrador: solo la ves vos</span></label>
        <label className="chk"><input type="radio" name="publicacion" value="programar" defaultChecked={!nuevo && v.estado === 'borrador' && !!v.publicarEn} /><span>Programar: se publica sola el día que elijas <input name="publicar_fecha" type="date" defaultValue={v.publicarEn} style={{ marginLeft: 8, minHeight: 34, padding: '4px 8px', border: '1.5px solid var(--line)', borderRadius: 8 }} /></span></label>
        {v.estado === 'cerrada' && <small>Esta fecha está cerrada. Al guardar, vuelve a la opción que elijas.</small>}
        <label className="chk" style={{ marginTop: 6 }}><input type="checkbox" name="avisar_espera" value="1" /><span>Avisar por mail a quienes están en la lista de espera (si ese mail está prendido en Mails automáticos)</span></label>
      </fieldset>}
    </>
  );
}
