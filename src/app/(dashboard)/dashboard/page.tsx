'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import useSWR from 'swr';
import { Suspense, useEffect, useState } from 'react';
import { Loader2, PlusCircle, FileText, Users, Target, TrendingUp, Activity, Clock, CheckCircle, AlertCircle, MessageSquare, Gavel } from 'lucide-react';
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

  const userInitials = user.name
    ?.split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase() || user.email?.[0]?.toUpperCase() || 'U';

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
            <span className="text-lg font-semibold text-blue-600">
              {userInitials}
            </span>
          </div>
          <div>
            <h2 className="text-lg font-semibold">{user.name || 'Anonymous'}</h2>
            <p className="text-sm text-gray-600">{user.email}</p>
            <Badge variant="outline" className="mt-1 capitalize">
              {user.role}
            </Badge>
          </div>
        </CardTitle>
      </CardHeader>
    </Card>
  );
}

function DashboardStats() {
  const [stats, setStats] = useState({
    submissions: { total: 0, pending: 0, approved: 0, inReview: 0 },
    milestones: { total: 0, completed: 0, inProgress: 0, pending: 0 },
    committees: { active: 0, isReviewer: false },
    recentActivity: [] as Array<{ type: string; project: string; time: string; }>
  });
  const [loading, setLoading] = useState(true);
  const { data: user } = useSWR('/api/user', fetcher);

  useEffect(() => {
    async function loadStats() {
      try {
        // This would typically be a real API call to get dashboard stats
        // For now, showing realistic placeholder data structure
        const mockStats = {
          submissions: { total: 2, pending: 1, approved: 1, inReview: 0 },
          milestones: { total: 8, completed: 2, inProgress: 3, pending: 3 },
          committees: { active: 3, isReviewer: user?.role === 'committee' || user?.role === 'admin' },
          recentActivity: [
            { type: 'milestone_completed', project: 'Next-Gen SDK', time: '2 hours ago' },
            { type: 'vote_cast', project: 'Blockchain Course', time: '1 day ago' },
            { type: 'submission_approved', project: 'DeFi Protocol', time: '3 days ago' }
          ]
        };
        setStats(mockStats);
      } catch (error) {
        console.error('Error loading dashboard stats:', error);
      } finally {
        setLoading(false);
      }
    }

    if (user) {
      loadStats();
    }
  }, [user]);

  if (loading || !user) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                <div className="h-3 bg-gray-200 rounded w-full"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const isReviewer = user.role === 'committee' || user.role === 'admin';

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            {isReviewer ? 'Review Queue' : 'Your Submissions'}
          </CardTitle>
          <FileText className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.submissions.total}</div>
          <p className="text-xs text-muted-foreground">
            {isReviewer ? `${stats.submissions.pending} pending review` : `${stats.submissions.approved} approved`}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Active Milestones
          </CardTitle>
          <Target className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.milestones.inProgress}</div>
          <p className="text-xs text-muted-foreground">
            {stats.milestones.completed} completed
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Committees
          </CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.committees.active}</div>
          <p className="text-xs text-muted-foreground">
            {isReviewer ? 'Reviewer access' : 'Available to apply'}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Success Rate
          </CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {stats.submissions.total > 0 ? 
              Math.round((stats.submissions.approved / stats.submissions.total) * 100) : 0}%
          </div>
          <p className="text-xs text-muted-foreground">
            Approval rate
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function RecentActivity() {
  const [activities, setActivities] = useState([
    {
      id: 1,
      type: 'milestone_completed',
      title: 'Milestone completed',
      description: 'Architecture Design milestone for Next-Gen SDK',
      time: '2 hours ago',
      icon: CheckCircle,
      color: 'text-green-600'
    },
    {
      id: 2,
      type: 'vote_cast',
      title: 'Vote cast',
      description: 'Approved submission for Blockchain Educational Course',
      time: '1 day ago',
      icon: MessageSquare,
      color: 'text-blue-600'
    },
    {
      id: 3,
      type: 'submission_approved',
      title: 'Submission approved',
      description: 'DeFi Protocol submission approved by committee',
      time: '3 days ago',
      icon: CheckCircle,
      color: 'text-green-600'
    },
    {
      id: 4,
      type: 'discussion_activity',
      title: 'New discussion message',
      description: 'Update posted on Infrastructure Tools project',
      time: '1 week ago',
      icon: Activity,
      color: 'text-orange-600'
    }
  ]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity) => {
            const Icon = activity.icon;
            return (
              <div key={activity.id} className="flex items-start gap-3">
                <div className={`p-2 rounded-full bg-gray-100 ${activity.color}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{activity.title}</p>
                  <p className="text-sm text-gray-600 truncate">{activity.description}</p>
                  <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-4 pt-4 border-t">
          <Link href="/dashboard/activity">
            <Button variant="outline" className="w-full" size="sm">
              View All Activity
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

function QuickActions() {
  const { data: user } = useSWR('/api/user', fetcher);
  const isReviewer = user?.role === 'committee' || user?.role === 'admin';

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {!isReviewer && (
            <Link href="/dashboard/submissions/new">
              <Button className="w-full h-16 flex flex-col items-center justify-center space-y-2">
                <PlusCircle className="h-6 w-6" />
                <span>New Submission</span>
              </Button>
            </Link>
          )}
          
          <Link href="/dashboard/submissions">
            <Button variant="outline" className="w-full h-16 flex flex-col items-center justify-center space-y-2">
              <FileText className="h-6 w-6" />
              <span>{isReviewer ? 'Review Submissions' : 'View Submissions'}</span>
            </Button>
          </Link>

          {isReviewer && (
            <Link href="/dashboard/review">
              <Button className="w-full h-16 flex flex-col items-center justify-center space-y-2">
                <Gavel className="h-6 w-6" />
                <span>Reviewer Dashboard</span>
              </Button>
            </Link>
          )}

          <Link href="/dashboard/activity">
            <Button variant="outline" className="w-full h-16 flex flex-col items-center justify-center space-y-2">
              <Activity className="h-6 w-6" />
              <span>Activity Feed</span>
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

function UpcomingDeadlines() {
  const deadlines = [
    {
      id: 1,
      title: 'Core Development Review',
      project: 'Next-Gen SDK',
      dueDate: 'Due in 3 days',
      status: 'in_progress',
      urgent: true
    },
    {
      id: 2,
      title: 'Final Submission Review',
      project: 'Educational Platform',
      dueDate: 'Due in 1 week',
      status: 'pending',
      urgent: false
    },
    {
      id: 3,
      title: 'Testing & Documentation',
      project: 'DeFi Protocol',
      dueDate: 'Due in 2 weeks',
      status: 'pending',
      urgent: false
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Upcoming Deadlines
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {deadlines.map((deadline) => (
            <div key={deadline.id} className={`p-3 rounded-lg border ${
              deadline.urgent ? 'border-orange-200 bg-orange-50' : 'border-gray-200 bg-gray-50'
            }`}>
              <div className="flex items-center justify-between mb-1">
                <p className="font-medium text-sm">{deadline.title}</p>
                {deadline.urgent && (
                  <AlertCircle className="h-4 w-4 text-orange-600" />
                )}
              </div>
              <p className="text-xs text-gray-600">{deadline.project}</p>
              <p className={`text-xs mt-1 ${
                deadline.urgent ? 'text-orange-600 font-medium' : 'text-gray-500'
              }`}>
                {deadline.dueDate}
              </p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Grant Dashboard</h1>
        <p className="text-muted-foreground">
          Track your grant applications, milestones, and committee activities
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <QuickActions />
          <UpcomingDeadlines />
        </div>
        <RecentActivity />
      </div>
    </div>
  );
}
