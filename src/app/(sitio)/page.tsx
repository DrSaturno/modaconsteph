import { getAjustesPublicos, getCatalogo } from '@/lib/catalogo';
import { Agenda, Cursos, Pasos, Portada, Preguntas, Regalo, Resenas, Sobre } from '@/components/sitio/secciones';

export default async function Inicio() {
  const [catalogo, aj] = await Promise.all([getCatalogo(), getAjustesPublicos()]);
  return (
    <main>
      <Portada catalogo={catalogo} />
      <Agenda catalogo={catalogo} />
      <Cursos catalogo={catalogo} />
      <Pasos />
      <Sobre />
      <Resenas aj={aj} />
      <Regalo catalogo={catalogo} />
      <Preguntas aj={aj} />
    </main>
  );
}
