import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { AlertCircle } from 'lucide-react'

export default async function PricingPage() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-xl">
        <Card>
          <CardHeader className="text-center">
            <div className="mb-4 flex justify-center">
              <AlertCircle className="h-12 w-12 text-orange-500" />
            </div>
            <CardTitle className="text-2xl">
              Pricing Temporarily Disabled
            </CardTitle>
            <CardDescription>
              Payment features are currently disabled while we focus on building
              the core grant submission platform.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-muted-foreground text-sm">
              We're focusing on the grant submission and review system. Payment
              features will be re-enabled in a future release.
            </p>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
