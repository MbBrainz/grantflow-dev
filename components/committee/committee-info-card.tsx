'use client';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Building2, 
  Users, 
  Globe, 
  Github, 
  Wallet, 
  CheckCircle, 
  AlertTriangle, 
  Crown,
  Shield,
  Eye
} from 'lucide-react';

interface Committee {
  id: number;
  name: string;
  description?: string;
  logoUrl?: string;
  focusAreas?: string;
  websiteUrl?: string;
  githubOrg?: string;
  walletAddress?: string;
  votingThreshold: number;
  isActive: boolean;
}

interface CommitteeInfoCardProps {
  committee: Committee;
  userRole?: 'admin' | 'curator' | 'reviewer' | null;
  isUserMember?: boolean;
  className?: string;
  showActions?: boolean;
}

export function CommitteeInfoCard({ 
  committee, 
  userRole = null, 
  isUserMember = false,
  className = "",
  showActions = true
}: CommitteeInfoCardProps) {
  
  const focusAreas = committee.focusAreas ? JSON.parse(committee.focusAreas) : [];
  
  const getRoleIcon = () => {
    switch (userRole) {
      case 'admin': return <Crown className="w-4 h-4 text-purple-600" />;
      case 'curator': return <Shield className="w-4 h-4 text-blue-600" />;
      case 'reviewer': return <Eye className="w-4 h-4 text-green-600" />;
      default: return null;
    }
  };

  const getRoleBadge = () => {
    if (!isUserMember || !userRole) return null;
    
    return (
      <Badge className={`${
        userRole === 'admin' ? 'bg-purple-100 text-purple-800' :
        userRole === 'curator' ? 'bg-blue-100 text-blue-800' :
        'bg-green-100 text-green-800'
      } flex items-center gap-1`}>
        {getRoleIcon()}
        {userRole.toUpperCase()}
      </Badge>
    );
  };

  return (
    <Card className={`p-6 ${className}`}>
      <div className="flex items-start gap-4">
        {/* Committee Logo/Icon */}
        <div className="p-3 rounded-full bg-blue-100 text-blue-600 flex-shrink-0">
          {committee.logoUrl ? (
            <img 
              src={committee.logoUrl} 
              alt={`${committee.name} logo`}
              className="w-8 h-8 rounded-full object-cover"
            />
          ) : (
            <Building2 className="w-8 h-8" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h3 className="text-xl font-semibold">{committee.name}</h3>
                {getRoleBadge()}
                <Badge className={`${
                  committee.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {committee.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>
              {committee.description && (
                <p className="text-gray-600 text-sm">{committee.description}</p>
              )}
            </div>
          </div>

          {/* Committee Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            {/* Focus Areas */}
            {focusAreas.length > 0 && (
              <div>
                <h4 className="font-medium text-sm text-gray-700 mb-2">Focus Areas</h4>
                <div className="flex flex-wrap gap-1">
                  {focusAreas.slice(0, 3).map((area: string, index: number) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {area}
                    </Badge>
                  ))}
                  {focusAreas.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{focusAreas.length - 3} more
                    </Badge>
                  )}
                </div>
              </div>
            )}

            {/* Voting Threshold */}
            <div>
              <h4 className="font-medium text-sm text-gray-700 mb-2">Voting Threshold</h4>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-gray-500" />
                <span className="text-sm">{committee.votingThreshold} curator votes required</span>
              </div>
            </div>
          </div>

          {/* Links */}
          <div className="flex flex-wrap gap-3">
            {committee.websiteUrl && (
              <Button variant="outline" size="sm" asChild>
                <a href={committee.websiteUrl} target="_blank" rel="noopener noreferrer">
                  <Globe className="w-4 h-4 mr-2" />
                  Website
                </a>
              </Button>
            )}
            
            {committee.githubOrg && (
              <Button variant="outline" size="sm" asChild>
                <a href={`https://github.com/${committee.githubOrg}`} target="_blank" rel="noopener noreferrer">
                  <Github className="w-4 h-4 mr-2" />
                  GitHub
                </a>
              </Button>
            )}
            
            {committee.walletAddress && (
              <Button variant="outline" size="sm">
                <Wallet className="w-4 h-4 mr-2" />
                {committee.walletAddress.slice(0, 6)}...{committee.walletAddress.slice(-4)}
              </Button>
            )}
          </div>

          {/* User Status Alert */}
          {!isUserMember && showActions && (
            <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-orange-600" />
                <span className="text-sm text-orange-700">
                  You are not a member of this committee. You cannot vote on submissions.
                </span>
              </div>
            </div>
          )}

          {isUserMember && showActions && (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="text-sm text-green-700">
                  You are a {userRole} of this committee with voting privileges.
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
} 