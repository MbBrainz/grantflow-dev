import '@fontsource-variable/manrope'
import './globals.css'
import type { Metadata, Viewport } from 'next'
import { SWRConfig } from 'swr'
import { NotificationProvider } from '@/components/providers/notification-provider'
import { SessionProvider } from '@/components/providers/session-provider'
import { getSession } from '@/lib/auth/next-auth'

export const metadata: Metadata = {
  title: 'GrantFlow - Grant Management Platform',
  description:
    'Streamlined grant application and review platform for committees and grantees.',
}

export const viewport: Viewport = {
  maximumScale: 1,
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getSession()

  return (
    <html lang="en">
      <body className="font-sans">
        <SessionProvider session={session}>
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
        </SessionProvider>
      </body>
    </html>
  )
}
