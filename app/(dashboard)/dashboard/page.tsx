'use client';

import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter
} from '@/components/ui/card';
import useSWR from 'swr';
import { Suspense } from 'react';
import { Loader2, PlusCircle, FileText, Users, Target } from 'lucide-react';
import Link from 'next/link';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

function UserProfile() {
  const { data: user, error } = useSWR('/api/user', fetcher);

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-red-600">Failed to load user data</p>
        </CardContent>
      </Card>
    );
  }

  if (!user) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center space-x-4">
            <div className="animate-pulse bg-gray-200 rounded-full h-12 w-12"></div>
            <div className="space-y-2">
              <div className="animate-pulse bg-gray-200 h-4 w-32 rounded"></div>
              <div className="animate-pulse bg-gray-200 h-3 w-48 rounded"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-3">
          <Avatar>
            <AvatarFallback>
              {user.name
                ?.split(' ')
                .map((n: string) => n[0])
                .join('')
                .toUpperCase() || user.email?.[0]?.toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
          <div>
            <h2 className="text-lg font-semibold">{user.name || 'Anonymous'}</h2>
            <p className="text-sm text-gray-600">{user.email}</p>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 capitalize">
              {user.role}
            </span>
          </div>
        </CardTitle>
      </CardHeader>
    </Card>
  );
}

function DashboardStats() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Your Submissions
          </CardTitle>
          <FileText className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">0</div>
          <p className="text-xs text-muted-foreground">
            +0 from last month
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Active Committees
          </CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">1</div>
          <p className="text-xs text-muted-foreground">
            Test Grant Committee
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Milestones Completed
          </CardTitle>
          <Target className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">0</div>
          <p className="text-xs text-muted-foreground">
            Ready to start building!
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function QuickActions() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link href="/dashboard/submissions/new">
            <Button className="w-full h-16 flex flex-col items-center justify-center space-y-2">
              <PlusCircle className="h-6 w-6" />
              <span>New Submission</span>
            </Button>
          </Link>
          <Link href="/dashboard/submissions">
            <Button variant="outline" className="w-full h-16 flex flex-col items-center justify-center space-y-2">
              <FileText className="h-6 w-6" />
              <span>View Submissions</span>
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Grant Dashboard</h1>
        <p className="text-muted-foreground">
          Manage your grant applications and track progress
        </p>
      </div>

      <Suspense 
        fallback={
          <Card>
            <CardContent className="p-6">
              <Loader2 className="h-8 w-8 animate-spin mx-auto" />
            </CardContent>
          </Card>
        }
      >
        <UserProfile />
      </Suspense>

      <DashboardStats />
      <QuickActions />
    </div>
  );
}
