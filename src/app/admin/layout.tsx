import './admin.css';
import type { Metadata } from 'next';

// El panel siempre se arma con datos del momento: no hace falta que la navegación sea instantánea.
export const instant = false;

export const metadata: Metadata = { title: { default: 'Panel', template: '%s · Panel' }, robots: { index: false, follow: false } };

export default function AdminLayout({ children }: LayoutProps<'/admin'>) {
  return <div className="adm">{children}</div>;
}
