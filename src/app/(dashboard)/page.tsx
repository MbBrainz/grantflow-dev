import {
  ArrowRight,
  CheckCircle,
  Clock,
  DollarSign,
  GitBranch,
  Globe,
  Shield,
  Users,
  Zap,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { LottieAnimation } from '@/components/ui/lottie-animation'

export default function HomePage() {
  return (
    <main>
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-50 via-white to-purple-50 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-12 lg:gap-8">
            <div className="sm:text-center md:mx-auto md:max-w-2xl lg:col-span-6 lg:text-left">
              <div className="mb-4">
                <span className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-800">
                  🚀 Web3 Grant Platform
                </span>
              </div>
              <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl md:text-6xl">
                Discover Grants,
                <span className="block bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Fund Innovation
                </span>
              </h1>
              <p className="mt-6 text-xl leading-relaxed text-gray-600">
                The first unified marketplace connecting grant committees with
                innovative teams. Streamline applications, collaborate
                transparently, and automate milestone-based funding.
              </p>
              <div className="mt-8 flex flex-col gap-4 sm:mx-auto sm:max-w-lg sm:flex-row lg:mx-0">
                <Button
                  size="lg"
                  className="rounded-full bg-gradient-to-r from-blue-600 to-purple-600 text-lg shadow-lg hover:from-blue-700 hover:to-purple-700"
                >
                  Explore Committees
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="rounded-full border-2 text-lg hover:bg-gray-50"
                >
                  Submit Application
                  <GitBranch className="ml-2 h-5 w-5" />
                </Button>
              </div>
              <div className="mt-8 flex items-center justify-center space-x-6 text-sm text-gray-500 lg:justify-start">
                <div className="flex items-center">
                  <CheckCircle className="mr-1 h-4 w-4 text-green-500" />
                  Instant Payouts
                </div>
                <div className="flex items-center">
                  <CheckCircle className="mr-1 h-4 w-4 text-green-500" />
                  Public Transparency
                </div>
                <div className="flex items-center">
                  <CheckCircle className="mr-1 h-4 w-4 text-green-500" />
                  GitHub Integration
                </div>
              </div>
            </div>
            <div className="relative mt-12 sm:mx-auto sm:max-w-lg lg:col-span-6 lg:mx-0 lg:mt-0 lg:flex lg:max-w-none lg:items-center">
              <LottieAnimation
                animationPath="/animations/grant-flow.json"
                className="mx-auto h-full w-full max-w-lg"
                loop={true}
                autoplay={true}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Platform Stats */}
      <section className="border-b bg-white py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-8 text-center lg:grid-cols-4">
            <div>
              <div className="text-3xl font-bold text-blue-600">$2.5M+</div>
              <div className="mt-1 text-sm text-gray-500">Total Funded</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-purple-600">150+</div>
              <div className="mt-1 text-sm text-gray-500">
                Active Committees
              </div>
            </div>
            <div>
              <div className="text-3xl font-bold text-green-600">500+</div>
              <div className="mt-1 text-sm text-gray-500">Projects Funded</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-orange-600">24h</div>
              <div className="mt-1 text-sm text-gray-500">Avg Review Time</div>
            </div>
          </div>
        </div>
      </section>

      {/* For Grant Committees */}
      <section className="bg-gradient-to-r from-blue-600 to-purple-600 py-20 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-4xl font-bold">For Grant Committees</h2>
            <p className="mx-auto max-w-3xl text-xl text-blue-100">
              Streamline your grant management with powerful tools for
              discovery, collaboration, and transparent funding.
            </p>
          </div>
          <div className="grid gap-8 lg:grid-cols-3">
            <div className="rounded-2xl bg-white/10 p-8 backdrop-blur-sm transition-colors hover:bg-white/20">
              <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 text-white">
                <Users className="h-6 w-6" />
              </div>
              <h3 className="mb-4 text-xl font-bold">Committee Profiles</h3>
              <p className="leading-relaxed text-blue-100">
                Create discoverable profiles with your focus areas, funding
                criteria, and approval workflows. Showcase your committee's
                impact and attract quality applications.
              </p>
            </div>

            <div className="rounded-2xl bg-white/10 p-8 backdrop-blur-sm transition-colors hover:bg-white/20">
              <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 text-white">
                <Shield className="h-6 w-6" />
              </div>
              <h3 className="mb-4 text-xl font-bold">Multi-Reviewer Voting</h3>
              <p className="leading-relaxed text-blue-100">
                Configure custom voting thresholds and approval workflows.
                Collaborate with co-reviewers through integrated discussion
                threads.
              </p>
            </div>

            <div className="rounded-2xl bg-white/10 p-8 backdrop-blur-sm transition-colors hover:bg-white/20">
              <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 text-white">
                <DollarSign className="h-6 w-6" />
              </div>
              <h3 className="mb-4 text-xl font-bold">Instant Payouts</h3>
              <p className="leading-relaxed text-blue-100">
                Trigger automated milestone-based payouts via multi-sig wallets.
                No more manual transaction coordination.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* For Grantee Teams */}
      <section className="bg-gray-50 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-4xl font-bold text-gray-900">
              For Grantee Teams
            </h2>
            <p className="mx-auto max-w-3xl text-xl text-gray-600">
              Discover opportunities, submit compelling applications, and track
              your progress through transparent milestone management.
            </p>
          </div>
          <div className="grid gap-8 lg:grid-cols-3">
            <div className="rounded-2xl bg-white p-8 shadow-lg transition-shadow hover:shadow-xl">
              <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 text-white">
                <Globe className="h-6 w-6" />
              </div>
              <h3 className="mb-4 text-xl font-bold text-gray-900">
                Committee Discovery
              </h3>
              <p className="leading-relaxed text-gray-600">
                Browse and compare grant committees by focus areas, funding
                amounts, and approval rates. Find the perfect match for your
                project.
              </p>
            </div>

            <div className="rounded-2xl bg-white p-8 shadow-lg transition-shadow hover:shadow-xl">
              <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-r from-orange-500 to-red-500 text-white">
                <GitBranch className="h-6 w-6" />
              </div>
              <h3 className="mb-4 text-xl font-bold text-gray-900">
                GitHub Integration
              </h3>
              <p className="leading-relaxed text-gray-600">
                Link repositories, PRs, and commits as proof of deliverables.
                Showcase your code contributions with full transparency.
              </p>
            </div>

            <div className="rounded-2xl bg-white p-8 shadow-lg transition-shadow hover:shadow-xl">
              <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                <Clock className="h-6 w-6" />
              </div>
              <h3 className="mb-4 text-xl font-bold text-gray-900">
                Real-time Tracking
              </h3>
              <p className="leading-relaxed text-gray-600">
                Track application status and milestone progress in real-time.
                Participate in discussions directly with committee reviewers.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Key Features */}
      <section className="bg-white py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-4xl font-bold text-gray-900">
              Why Choose GrantFlow?
            </h2>
            <p className="mx-auto max-w-3xl text-xl text-gray-600">
              The only platform that brings together committees and teams in a
              transparent, efficient grant ecosystem.
            </p>
          </div>

          <div className="grid items-center gap-16 lg:grid-cols-2">
            <div>
              <div className="space-y-8">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500 text-white">
                      <Zap className="h-5 w-5" />
                    </div>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Unified Workflow
                    </h3>
                    <p className="text-gray-600">
                      Replace scattered Discord channels, GitHub issues, and
                      Google Docs with one integrated platform.
                    </p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500 text-white">
                      <Shield className="h-5 w-5" />
                    </div>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Public Transparency
                    </h3>
                    <p className="text-gray-600">
                      All discussions, voting, and decisions are visible to
                      build trust and accountability.
                    </p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500 text-white">
                      <DollarSign className="h-5 w-5" />
                    </div>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Smart Contracts
                    </h3>
                    <p className="text-gray-600">
                      Automated milestone-based payouts through secure multi-sig
                      wallet integration.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:text-center">
              <div className="rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 p-8 text-white">
                <h3 className="mb-4 text-2xl font-bold">
                  Ready to Get Started?
                </h3>
                <p className="mb-6 text-blue-100">
                  Join the future of grant management. Whether you're a
                  committee looking to streamline operations or a team seeking
                  funding, we've got you covered.
                </p>
                <div className="space-y-3">
                  <Button
                    size="lg"
                    variant="secondary"
                    className="w-full rounded-full"
                  >
                    Create Committee Profile
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="w-full rounded-full border-white text-white hover:bg-white hover:text-blue-600"
                  >
                    Browse Grant Opportunities
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
