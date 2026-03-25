import type { Metadata } from 'next'
import Header from '@/components/ui/Header'
import ErrorBoundary from '@/components/ErrorBoundary'
import './globals.css'

export const metadata: Metadata = {
  title: 'Qadam',
  description: 'Платформа для поступления в университеты',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ru">
      <body className="antialiased">
        <Header />
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
      </body>
    </html>
  )
}
