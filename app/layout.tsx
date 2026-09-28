import type { Metadata, Viewport } from 'next'
import '@fontsource-variable/fraunces/full.css'
import '@fontsource-variable/figtree/index.css'
import './globals.css'

export const metadata: Metadata = {
  title: 'Louis R. — Digital Marketing Manager · Île Signal',
  description:
    'Portfolio de Louis R., Digital Marketing Manager : une promenade sur une petite île, du contenu à l’influence et à l’IA. Campagnes pour 15 marques depuis 2018.',
}

export const viewport: Viewport = {
  themeColor: '#e9e3d4',
  colorScheme: 'light',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  )
}
