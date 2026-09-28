import type { Metadata, Viewport } from 'next'
import '@fontsource/gloock/400.css'
import '@fontsource-variable/archivo/wdth.css'
import '@fontsource/martian-mono/400.css'
import './globals.css'

export const metadata: Metadata = {
  title: 'Louis R. — Digital Marketing Manager',
  description:
    "Portfolio en cinq actes : contenus, influence, social media, publicité et IA. Campagnes pour 14 marques depuis 2018.",
}

export const viewport: Viewport = {
  themeColor: '#141311',
  colorScheme: 'dark',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  )
}
