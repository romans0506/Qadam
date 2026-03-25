import type { Metadata } from 'next'
import Header from '@/components/ui/Header'
import ErrorBoundary from '@/components/ErrorBoundary'
import PageTransition from '@/components/ui/PageTransition'
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
          <PageTransition>
            {children}
          </PageTransition>
        </ErrorBoundary>
      </body>
    </html>
  )
}
