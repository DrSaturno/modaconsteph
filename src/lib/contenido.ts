/* Textos fijos de la web. Reseñas y datos de la presentación de Steph son los de su web actual. */

export const RESENAS = [
  { autora: 'Marina Lopez', texto: 'Hermosa experiencia! Steph es una profe maravillosa, gran profesional. Hice el curso de colorimetría y automaquillaje, aprendí un montón y conocí gente maravillosa. Ya me anoté en otro curso! GRACIAS Steph!' },
  { autora: 'Brenda Chuquimia', texto: 'Estuve 2 meses aprendiendo con Steph, fue la mejor decisión q tomé, aprendes desde cero sobre colorimetría, técnicas, tips. Ella es muy amable y cálida a la hora de explicar que se nota su pasión, lo transmite; es un buen ambiente donde la energía fluye, muy linda experiencia y con ganas de seguir aprendiendo.' },
];

export const PASOS = [
  { t: 'Elegí tu fecha', d: 'Ves al instante cuántos lugares quedan en cada curso.' },
  { t: 'Reservá online', d: 'Con tarjeta, Mercado Pago o transferencia. Podés pagar el total o dejar una seña.' },
  { t: 'Recibí todo por mail', d: 'La confirmación, los recordatorios y, el mismo día de la clase, la dirección exacta.' },
];

export function preguntas(politicaCambios: string) {
  return [
    { q: '¿Necesito experiencia previa?', a: 'No. Hay propuestas para empezar desde cero y otras para profundizar. Muchas alumnas llegan sin saber nada y se van con su propio maquillaje y su paleta de colores.' },
    { q: '¿Cómo reservo mi lugar?', a: 'Elegís la fecha, completás tus datos y pagás online. Ves al instante cuántos lugares quedan y recibís la confirmación por mail.' },
    { q: '¿Qué pasa si no puedo ir?', a: politicaCambios || 'Podés reprogramar avisando con anticipación. Las condiciones de cada curso figuran en su ficha y en tu mail de confirmación.' },
    { q: '¿Puedo ir con una amiga?', a: 'Sí. Los grupos presenciales son de hasta 4 alumnas, así que conviene reservar con tiempo. Escribinos por WhatsApp si querés reservar varios lugares juntos.' },
  ];
}
