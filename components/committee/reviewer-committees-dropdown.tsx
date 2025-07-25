'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Building2, 
  ChevronDown, 
  Crown,
  Shield,
  Eye,
  Users,
  CheckCircle,
  AlertTriangle,
  Loader2
} from 'lucide-react';

interface Committee {
  id: number;
  name: string;
  description?: string;
  logoUrl?: string;
  focusAreas?: string;
  isActive: boolean;
}

interface CommitteeMembership {
  committee: Committee;
  role: 'admin' | 'reviewer';
  permissions?: string[];
  joinedAt: string;
  isActive: boolean;
}

interface ReviewerCommitteesDropdownProps {
  currentUser: any;
  currentCommitteeId?: number;
  onCommitteeSelect?: (committee: Committee) => void;
  className?: string;
}

export function ReviewerCommitteesDropdown({ 
  currentUser, 
  currentCommitteeId,
  onCommitteeSelect,
  className = ""
}: ReviewerCommitteesDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [memberships, setMemberships] = useState<CommitteeMembership[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadUserCommittees();
  }, [currentUser?.id]);

  const loadUserCommittees = async () => {
    if (!currentUser?.id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      // This would typically be an API call
      // For now, we'll simulate the data structure
      const response = await fetch(`/api/user/committees?userId=${currentUser.id}`);
      
      if (!response.ok) {
        throw new Error('Failed to load committees');
      }
      
      const data = await response.json();
      setMemberships(data.memberships || []);
      
    } catch (error) {
              console.error('[ReviewerCommitteesDropdown]: Error loading committees', error);
      setError('Failed to load committee memberships');
      // Fallback to empty array for now
      setMemberships([]);
    } finally {
      setLoading(false);
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return <Crown className="w-3 h-3 text-purple-600" />;
      case 'reviewer': return <Shield className="w-3 h-3 text-blue-600" />;
      default: return null;
    }
  };

  const getRoleBadge = (role: string) => (
    <Badge className={`text-xs ${
      role === 'admin' ? 'bg-purple-100 text-purple-800' :
      role === 'reviewer' ? 'bg-blue-100 text-blue-800' :
      'bg-green-100 text-green-800'
    } flex items-center gap-1`}>
      {getRoleIcon(role)}
      {role.toUpperCase()}
    </Badge>
  );

  const currentCommittee = memberships.find(m => m.committee.id === currentCommitteeId);
  const activeMemberships = memberships.filter(m => m.isActive && m.committee.isActive);

  if (loading) {
    return (
      <Card className={`p-3 ${className}`}>
        <div className="flex items-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-sm text-gray-600">Loading committees...</span>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={`p-3 border-red-200 bg-red-50 ${className}`}>
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-600" />
          <span className="text-sm text-red-700">{error}</span>
        </div>
      </Card>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {/* Current Committee Display */}
      <Button
        variant="outline"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full justify-between"
      >
        <div className="flex items-center gap-3">
          <Building2 className="w-4 h-4" />
          <div className="text-left">
            {currentCommittee ? (
              <>
                <div className="font-medium">{currentCommittee.committee.name}</div>
                <div className="text-xs text-gray-600 flex items-center gap-1">
                  {getRoleIcon(currentCommittee.role)}
                  Your role: {currentCommittee.role}
                </div>
              </>
            ) : (
              <>
                <div className="font-medium">Committee Memberships</div>
                <div className="text-xs text-gray-600">{activeMemberships.length} committee{activeMemberships.length !== 1 ? 's' : ''}</div>
              </>
            )}
          </div>
        </div>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </Button>

      {/* Dropdown Content */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown Panel */}
          <Card className="absolute top-full left-0 right-0 mt-2 p-0 z-20 shadow-lg border">
            <div className="p-3 border-b bg-gray-50">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-gray-600" />
                <span className="font-medium text-sm">Your Committee Memberships</span>
              </div>
            </div>

            <div className="max-h-80 overflow-y-auto">
              {activeMemberships.length === 0 ? (
                <div className="p-4 text-center">
                  <Building2 className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600 mb-1">No committee memberships</p>
                  <p className="text-xs text-gray-500">You need to be added to a committee to review submissions</p>
                </div>
              ) : (
                <div className="divide-y">
                  {activeMemberships.map((membership) => (
                    <div
                      key={membership.committee.id}
                      className={`p-3 hover:bg-gray-50 cursor-pointer transition-colors ${
                        membership.committee.id === currentCommitteeId ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                      }`}
                      onClick={() => {
                        onCommitteeSelect?.(membership.committee);
                        setIsOpen(false);
                      }}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium text-sm truncate">{membership.committee.name}</h4>
                            {membership.committee.id === currentCommitteeId && (
                              <CheckCircle className="w-3 h-3 text-blue-600 flex-shrink-0" />
                            )}
                          </div>
                          
                          {membership.committee.description && (
                            <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                              {membership.committee.description}
                            </p>
                          )}
                          
                          <div className="flex items-center gap-2">
                            {getRoleBadge(membership.role)}
                            <span className="text-xs text-gray-500">
                              Joined {new Date(membership.joinedAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-3 border-t bg-gray-50">
              <div className="flex items-center justify-between text-xs text-gray-600">
                <span>{activeMemberships.length} active membership{activeMemberships.length !== 1 ? 's' : ''}</span>
                <Button variant="ghost" size="sm" className="h-6 text-xs">
                  Manage Memberships
                </Button>
              </div>
            </div>
          </Card>
        </>
      )}
    </div>
  );
} 