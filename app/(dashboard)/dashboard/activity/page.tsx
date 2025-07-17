import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Settings,
  LogOut,
  UserPlus,
  Lock,
  UserCog,
  AlertCircle,
  FileText,
  Edit,
  Trash2,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { ActivityType } from '@/lib/db/schema';

// Simple activity log type for display
type ActivityLog = {
  action: string;
  userName?: string;
  timestamp: string | Date;
};

const iconMap: Record<ActivityType, LucideIcon> = {
  [ActivityType.SIGN_UP]: UserPlus,
  [ActivityType.SIGN_IN]: UserCog,
  [ActivityType.SIGN_OUT]: LogOut,
  [ActivityType.UPDATE_PASSWORD]: Lock,
  [ActivityType.DELETE_ACCOUNT]: Trash2,
  [ActivityType.UPDATE_ACCOUNT]: Settings,
  [ActivityType.CREATE_SUBMISSION]: FileText,
  [ActivityType.UPDATE_SUBMISSION]: Edit,
  [ActivityType.DELETE_SUBMISSION]: Trash2,
  [ActivityType.ADD_MILESTONE]: FileText,
  [ActivityType.UPDATE_MILESTONE]: Edit,
  [ActivityType.SUBMIT_REVIEW]: Edit,
  [ActivityType.CREATE_COMMITTEE]: Users,
  [ActivityType.JOIN_COMMITTEE]: UserPlus,
  [ActivityType.LEAVE_COMMITTEE]: LogOut,
};

function getRelativeTime(date: Date) {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return 'just now';
  if (diffInSeconds < 3600)
    return `${Math.floor(diffInSeconds / 60)} minutes ago`;
  if (diffInSeconds < 86400)
    return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  if (diffInSeconds < 604800)
    return `${Math.floor(diffInSeconds / 86400)} days ago`;
  return date.toLocaleDateString();
}

export default async function ActivityPage() {
  // For now, show empty state since activity logs are simplified
  const activities: ActivityLog[] = [];

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Activity Log</h1>
        <p className="text-muted-foreground">
          Track your recent activity and account changes
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              No recent activity to display. Activity logging has been simplified for the MVP.
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Future versions will include detailed activity tracking for submissions, reviews, and committee interactions.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
