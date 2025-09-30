import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle } from 'lucide-react'

export default function ActivityPage() {
  // For now, show empty state since activity logs are simplified

  return (
    <div className="mx-auto max-w-4xl p-6">
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
          <div className="py-8 text-center">
            <AlertCircle className="text-muted-foreground mx-auto mb-4 h-12 w-12" />
            <p className="text-muted-foreground">
              No recent activity to display. Activity logging has been
              simplified for the MVP.
            </p>
            <p className="text-muted-foreground mt-2 text-sm">
              Future versions will include detailed activity tracking for
              submissions, reviews, and committee interactions.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
