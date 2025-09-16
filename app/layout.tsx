import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'التحدي - لعبة الجاسوس',
  description: 'لعبة حفلة ممتعة حيث يحاول اللاعبون التعرف على الجاسوس',
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50">
        {children}
      </body>
    </html>
  )
}
