import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';

export default async function PricingPage() {
  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="max-w-xl mx-auto">
        <Card>
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <AlertCircle className="h-12 w-12 text-orange-500" />
            </div>
            <CardTitle className="text-2xl">Pricing Temporarily Disabled</CardTitle>
            <CardDescription>
              Payment features are currently disabled while we focus on building the core grant submission platform.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-muted-foreground">
              We're focusing on the grant submission and review system. Payment features will be re-enabled in a future release.
            </p>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
