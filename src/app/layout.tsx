import type { Metadata } from 'next'
import '../styles/index.css'
import { Providers } from '../components/providers'
import { Analytics } from '@vercel/analytics/next'
import { MiniAppProvider } from '@neynar/react'

export const viewport = {
  width: 'device-width',
  initialScale: 1,
}

export const metadata: Metadata = {
  title: 'Web3 Wingman MVP',
  description: 'Track Web3 projects via X & post on Farcaster',
  icons: {
    icon: [
      { url: '/favicon.ico', type: 'image/x-icon' }
    ],
  },
  openGraph: {
    images: ['/icon.png'],  
    locale: 'en_US',
    type: 'website',
  },
  other: {
    'fc:frame': 'vNext',
    'fc:frame:button:1': 'Get Update',
    'fc:frame:button:2': 'Gen Post Idea',
    'fc:frame:button:3': 'Track on Base',
    'fc:frame:input:text': 'Enter project handle (e.g., @MorphLayer)',
    'fc:frame:input:required': 'true',
    'fc:frame:post-url': 'https://bead-mvp.vercel.app/frame',
    'fc:frame:post-button-text': 'Cast Update',
    'fc:frame:image': '/hero.png',
    'fc:frame:state-hash': 'web3-wingman-v1',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <style dangerouslySetInnerHTML={{
          __html: `
            /* Farcaster Mini App Container Sizing */
            html, body {
              margin: 0;
              padding: 0;
              width: 100%;
              height: 100%;
              overflow-x: hidden;
            }
            
            /* Desktop - Fixed dimensions for Farcaster web */
            @media (min-width: 768px) {
              body {
                max-width: 424px;
                height: 695px;
                margin: 0 auto;
              }
            }
            
            /* Mobile - Full device dimensions */
            @media (max-width: 767px) {
              body {
                width: 100vw;
                height: 100vh;
              }
            }
          `
        }} />
      </head>
      <body suppressHydrationWarning={true}>
        <Providers>{children}</Providers>
        <Analytics />
        
        <script type="module" async src="https://static.rocket.new/rocket-web.js?_cfg=https%3A%2F%2Fbeadapp2523back.builtwithrocket.new&_be=https%3A%2F%2Fapplication.rocket.new&_v=0.1.10" />
        <script type="module" defer src="https://static.rocket.new/rocket-shot.js?v=0.0.1" />
      </body>
    </html>
  )
}