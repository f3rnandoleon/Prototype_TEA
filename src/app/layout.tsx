import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Plataforma Integral de Apoyo para Niños Autistas',
  description:
    'Entorno digital accesible y neuroafirmativo para comunicación SAAC, rutinas visuales, educación adaptada y bienestar colaborativo entre tutores, profesionales y docentes.',
  keywords: ['TEA', 'Autismo', 'SAAC', 'Rutinas Visuales', 'Educación Adaptada', 'Pictogramas', 'Zona de Calma'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className="min-h-screen bg-background text-foreground antialiased selection:bg-emerald-100 selection:text-emerald-900">
        {children}
      </body>
    </html>
  );
}
