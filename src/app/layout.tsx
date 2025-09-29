import './globals.css'
import type { Metadata, Viewport } from 'next'
import { Manrope } from 'next/font/google'
import { SWRConfig } from 'swr'
import { NotificationProvider } from '@/components/providers/notification-provider'

export const metadata: Metadata = {
  title: 'GrantFlow - Grant Management Platform',
  description:
    'Streamlined grant application and review platform for committees and grantees.',
}

export const viewport: Viewport = {
  maximumScale: 1,
}

const manrope = Manrope({ subsets: ['latin'] })

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={manrope.className}>
        <SWRConfig
          value={{
            refreshInterval: 0,
            revalidateOnFocus: false,
            revalidateOnReconnect: true,
            errorRetryCount: 2,
            errorRetryInterval: 5000,
          }}
        >
          <NotificationProvider>{children}</NotificationProvider>
        </SWRConfig>
      </body>
    </html>
  )
}
