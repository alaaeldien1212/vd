import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Navigation from '@/components/Navigation'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Milestone Tracker - Procurement & Construction SaaS',
  description: 'Centralized milestone tracking for procurement and construction projects',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="min-h-screen bg-gray-50 flex">
          <Navigation />
          <div className="flex-1">
            {children}
          </div>
        </div>
      </body>
    </html>
  )
}
