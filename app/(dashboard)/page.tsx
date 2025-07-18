import { Button } from "@/components/ui/button";
import { ArrowRight, Users, DollarSign, GitBranch, Clock, Shield, Zap, Globe, CheckCircle } from "lucide-react";
import { LottieAnimation } from "@/components/ui/lottie-animation";

export default function HomePage() {
  return (
    <main>
      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-12 lg:gap-8">
            <div className="sm:text-center md:max-w-2xl md:mx-auto lg:col-span-6 lg:text-left">
              <div className="mb-4">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                  🚀 Web3 Grant Platform
                </span>
              </div>
              <h1 className="text-4xl font-bold text-gray-900 tracking-tight sm:text-5xl md:text-6xl">
                Discover Grants,
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                  Fund Innovation
                </span>
              </h1>
              <p className="mt-6 text-xl text-gray-600 leading-relaxed">
                The first unified marketplace connecting grant committees with innovative teams. 
                Streamline applications, collaborate transparently, and automate milestone-based funding.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-4 sm:max-w-lg sm:mx-auto lg:mx-0">
                <Button
                  size="lg"
                  className="text-lg rounded-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg"
                >
                  Explore Committees
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="text-lg rounded-full border-2 hover:bg-gray-50"
                >
                  Submit Application
                  <GitBranch className="ml-2 h-5 w-5" />
                </Button>
              </div>
              <div className="mt-8 flex items-center justify-center lg:justify-start space-x-6 text-sm text-gray-500">
                <div className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                  Instant Payouts
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                  Public Transparency
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                  GitHub Integration
                </div>
              </div>
            </div>
            <div className="mt-12 relative sm:max-w-lg sm:mx-auto lg:mt-0 lg:max-w-none lg:mx-0 lg:col-span-6 lg:flex lg:items-center">
              <LottieAnimation 
                animationPath="/animations/grant-flow.json"
                className="w-full h-full max-w-lg mx-auto"
                loop={true}
                autoplay={true}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Platform Stats */}
      <section className="py-12 bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold text-blue-600">$2.5M+</div>
              <div className="text-sm text-gray-500 mt-1">Total Funded</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-purple-600">150+</div>
              <div className="text-sm text-gray-500 mt-1">Active Committees</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-green-600">500+</div>
              <div className="text-sm text-gray-500 mt-1">Projects Funded</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-orange-600">24h</div>
              <div className="text-sm text-gray-500 mt-1">Avg Review Time</div>
            </div>
          </div>
        </div>
      </section>

      {/* For Grant Committees */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">For Grant Committees</h2>
            <p className="text-xl text-blue-100 max-w-3xl mx-auto">
              Streamline your grant management with powerful tools for discovery, collaboration, and transparent funding.
            </p>
          </div>
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 hover:bg-white/20 transition-colors">
              <div className="flex items-center justify-center h-12 w-12 rounded-xl bg-white/20 text-white mb-6">
                <Users className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold mb-4">Committee Profiles</h3>
              <p className="text-blue-100 leading-relaxed">
                Create discoverable profiles with your focus areas, funding criteria, and approval workflows. 
                Showcase your committee's impact and attract quality applications.
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 hover:bg-white/20 transition-colors">
              <div className="flex items-center justify-center h-12 w-12 rounded-xl bg-white/20 text-white mb-6">
                <Shield className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold mb-4">Multi-Curator Voting</h3>
              <p className="text-blue-100 leading-relaxed">
                Configure custom voting thresholds and approval workflows. 
                Collaborate with co-curators through integrated discussion threads.
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 hover:bg-white/20 transition-colors">
              <div className="flex items-center justify-center h-12 w-12 rounded-xl bg-white/20 text-white mb-6">
                <DollarSign className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold mb-4">Instant Payouts</h3>
              <p className="text-blue-100 leading-relaxed">
                Trigger automated milestone-based payouts via multi-sig wallets. 
                No more manual transaction coordination.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* For Grantee Teams */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">For Grantee Teams</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Discover opportunities, submit compelling applications, and track your progress through transparent milestone management.
            </p>
          </div>
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow">
              <div className="flex items-center justify-center h-12 w-12 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 text-white mb-6">
                <Globe className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Committee Discovery</h3>
              <p className="text-gray-600 leading-relaxed">
                Browse and compare grant committees by focus areas, funding amounts, and approval rates. 
                Find the perfect match for your project.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow">
              <div className="flex items-center justify-center h-12 w-12 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 text-white mb-6">
                <GitBranch className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">GitHub Integration</h3>
              <p className="text-gray-600 leading-relaxed">
                Link repositories, PRs, and commits as proof of deliverables. 
                Showcase your code contributions with full transparency.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow">
              <div className="flex items-center justify-center h-12 w-12 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white mb-6">
                <Clock className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Real-time Tracking</h3>
              <p className="text-gray-600 leading-relaxed">
                Track application status and milestone progress in real-time. 
                Participate in discussions directly with committee curators.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Key Features */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Why Choose GrantFlow?</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              The only platform that brings together committees and teams in a transparent, efficient grant ecosystem.
            </p>
          </div>
          
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="space-y-8">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-blue-500 text-white">
                      <Zap className="h-5 w-5" />
                    </div>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-semibold text-gray-900">Unified Workflow</h3>
                    <p className="text-gray-600">Replace scattered Discord channels, GitHub issues, and Google Docs with one integrated platform.</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-green-500 text-white">
                      <Shield className="h-5 w-5" />
                    </div>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-semibold text-gray-900">Public Transparency</h3>
                    <p className="text-gray-600">All discussions, voting, and decisions are visible to build trust and accountability.</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-purple-500 text-white">
                      <DollarSign className="h-5 w-5" />
                    </div>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-semibold text-gray-900">Smart Contracts</h3>
                    <p className="text-gray-600">Automated milestone-based payouts through secure multi-sig wallet integration.</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="lg:text-center">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white">
                <h3 className="text-2xl font-bold mb-4">Ready to Get Started?</h3>
                <p className="text-blue-100 mb-6">
                  Join the future of grant management. Whether you're a committee looking to streamline operations 
                  or a team seeking funding, we've got you covered.
                </p>
                <div className="space-y-3">
                  <Button size="lg" variant="secondary" className="w-full rounded-full">
                    Create Committee Profile
                  </Button>
                  <Button size="lg" variant="outline" className="w-full rounded-full text-white border-white hover:bg-white hover:text-blue-600">
                    Browse Grant Opportunities
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
