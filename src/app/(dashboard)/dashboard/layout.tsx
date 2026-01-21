'use client'

import {
  Activity,
  Building2,
  ChevronLeft,
  ChevronRight,
  FileText,
  Gavel,
  LayoutDashboard,
  Menu,
  Settings,
  Shield,
} from 'lucide-react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import useSWR from 'swr'
import { Button } from '@/components/ui/button'
import type { User } from '@/lib/db/schema'
import { cn, fetcher } from '@/lib/utils'

interface NavItem {
  href: string
  icon: React.ComponentType<{ className?: string }>
  label: string
  visibleFor?: ('team' | 'committee' | 'admin')[]
}

interface UserCommittees {
  committees: Array<{
    id: number
    name: string
  }>
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isHovered, setIsHovered] = useState(false)

  // Fetch user data for role-based navigation
  const { data: user } = useSWR<User>('/api/user', fetcher<User>)

  // Fetch user's committees
  const { data: userCommittees } = useSWR<UserCommittees>(
    user ? '/api/user/committees' : null,
    fetcher<UserCommittees>
  )

  const isReviewer =
    user?.primaryRole === 'committee' || user?.primaryRole === 'admin'

  const navItems: NavItem[] = [
    { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    {
      href: '/dashboard/submissions',
      icon: FileText,
      label: 'Submissions',
      visibleFor: ['team', 'admin'],
    },
    {
      href: '/dashboard/review',
      icon: Gavel,
      label: 'Review',
      visibleFor: ['committee', 'admin'],
    },
    {
      href: '/dashboard/my-committees',
      icon: Building2,
      label: 'My Committees',
      visibleFor: ['committee', 'admin'],
    },
    { href: '/dashboard/settings', icon: Settings, label: 'Settings' },
    { href: '/dashboard/activity', icon: Activity, label: 'Activity' },
    { href: '/dashboard/security', icon: Shield, label: 'Security' },
  ]

  // Filter nav items based on user role
  const filteredNavItems = navItems.filter(item => {
    if (!item.visibleFor) return true
    if (!user?.primaryRole) return true // Show all if role unknown
    return item.visibleFor.includes(
      user.primaryRole as 'team' | 'committee' | 'admin'
    )
  })

  // Handle My Committees navigation - redirect to committee if user has only one
  const handleCommitteesClick = (e: React.MouseEvent) => {
    if (userCommittees?.committees.length === 1) {
      e.preventDefault()
      router.push(`/dashboard/committees/${userCommittees.committees[0].id}`)
    }
  }

  // Determine if sidebar should be expanded (either pinned open or hovered)
  const sidebarExpanded = !isCollapsed || isHovered

  return (
    <div className="mx-auto flex min-h-[calc(100dvh-68px)] w-full max-w-7xl flex-col">
      {/* Mobile header */}
      <div className="flex items-center justify-between border-b border-gray-200 bg-white p-4 lg:hidden">
        <div className="flex items-center">
          <span className="font-medium">Dashboard</span>
        </div>
        <Button
          className="-mr-3"
          variant="ghost"
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        >
          <Menu className="h-6 w-6" />
          <span className="sr-only">Toggle sidebar</span>
        </Button>
      </div>

      <div className="flex h-full flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside
          className={cn(
            'border-r border-gray-200 bg-white transition-all duration-200 ease-in-out lg:block lg:bg-gray-50',
            isSidebarOpen ? 'block' : 'hidden',
            'absolute inset-y-0 left-0 z-40 transform lg:relative lg:translate-x-0',
            isSidebarOpen ? 'translate-x-0' : '-translate-x-full',
            sidebarExpanded ? 'w-64' : 'w-16'
          )}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <nav className="flex h-full flex-col overflow-y-auto p-2">
            {/* Collapse toggle button - only visible on desktop */}
            <div className="mb-2 hidden justify-end lg:flex">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => setIsCollapsed(!isCollapsed)}
                title={isCollapsed ? 'Pin sidebar open' : 'Collapse sidebar'}
              >
                {isCollapsed ? (
                  <ChevronRight className="h-4 w-4" />
                ) : (
                  <ChevronLeft className="h-4 w-4" />
                )}
              </Button>
            </div>

            {filteredNavItems.map(item => {
              const isActive =
                pathname === item.href ||
                (item.href !== '/dashboard' && pathname.startsWith(item.href))
              const isCommittees = item.href === '/dashboard/my-committees'

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  passHref
                  onClick={isCommittees ? handleCommitteesClick : undefined}
                >
                  <Button
                    variant={isActive ? 'secondary' : 'ghost'}
                    className={cn(
                      'my-1 w-full shadow-none',
                      sidebarExpanded
                        ? 'justify-start px-3'
                        : 'justify-center px-0',
                      isActive ? 'bg-gray-100' : ''
                    )}
                    onClick={() => setIsSidebarOpen(false)}
                    title={!sidebarExpanded ? item.label : undefined}
                  >
                    <item.icon
                      className={cn('h-4 w-4', sidebarExpanded && 'mr-2')}
                    />
                    {sidebarExpanded && <span>{item.label}</span>}
                  </Button>
                </Link>
              )
            })}
          </nav>
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto p-0 lg:p-4">{children}</main>
      </div>

      {/* Mobile sidebar overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/20 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </div>
  )
}
