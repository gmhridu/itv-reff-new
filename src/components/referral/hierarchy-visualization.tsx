'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  TrendingUp, 
  Crown, 
  Star,
  ChevronDown,
  ChevronRight,
  UserCheck,
  UserX,
  DollarSign
} from 'lucide-react';

interface HierarchyStats {
  aLevelCount: number;
  bLevelCount: number;
  cLevelCount: number;
  totalCount: number;
}

interface TeamMember {
  id: string;
  name: string;
  email: string;
  level: 'A_LEVEL' | 'B_LEVEL' | 'C_LEVEL';
  joinedAt: string;
  currentPosition: {
    name: string;
    level: number;
  } | null;
  isActive: boolean;
  totalEarnings: number;
}

interface HierarchyData {
  hierarchyStats: HierarchyStats;
  subordinatesByLevel: {
    aLevel: TeamMember[];
    bLevel: TeamMember[];
    cLevel: TeamMember[];
  };
  teamMetrics: {
    totalTeamSize: number;
    activeMembers: number;
    totalTeamEarnings: number;
    averageEarningsPerMember: number;
  };
  positionDistribution: Record<string, number>;
  growthMetrics: {
    aLevel: number;
    bLevel: number;
    cLevel: number;
    total: number;
  };
}

export default function HierarchyVisualization() {
  const [hierarchyData, setHierarchyData] = useState<HierarchyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedLevels, setExpandedLevels] = useState<Set<string>>(new Set(['A_LEVEL']));

  useEffect(() => {
    fetchHierarchyData();
  }, []);

  const fetchHierarchyData = async () => {
    try {
      const response = await fetch('/api/referrals/hierarchy');
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setHierarchyData(result.data);
        }
      }
    } catch (error) {
      console.error('Error fetching hierarchy data:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleLevel = (level: string) => {
    const newExpanded = new Set(expandedLevels);
    if (newExpanded.has(level)) {
      newExpanded.delete(level);
    } else {
      newExpanded.add(level);
    }
    setExpandedLevels(newExpanded);
  };

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'A_LEVEL':
        return <Crown className="w-5 h-5 text-yellow-500" />;
      case 'B_LEVEL':
        return <Star className="w-5 h-5 text-blue-500" />;
      case 'C_LEVEL':
        return <Users className="w-5 h-5 text-green-500" />;
      default:
        return <Users className="w-5 h-5 text-gray-500" />;
    }
  };

  const getLevelName = (level: string) => {
    switch (level) {
      case 'A_LEVEL':
        return 'A-Level (Direct Referrals)';
      case 'B_LEVEL':
        return 'B-Level (2nd Generation)';
      case 'C_LEVEL':
        return 'C-Level (3rd Generation)';
      default:
        return level;
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'A_LEVEL':
        return 'bg-yellow-50 border-yellow-200';
      case 'B_LEVEL':
        return 'bg-blue-50 border-blue-200';
      case 'C_LEVEL':
        return 'bg-green-50 border-green-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!hierarchyData) {
    return (
      <div className="text-center py-12">
        <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">No Hierarchy Data</h3>
        <p className="text-gray-600">Start referring people to build your team hierarchy.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Hierarchy Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Team</p>
                <p className="text-2xl font-bold">{hierarchyData.teamMetrics.totalTeamSize}</p>
              </div>
              <Users className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Members</p>
                <p className="text-2xl font-bold text-green-600">{hierarchyData.teamMetrics.activeMembers}</p>
              </div>
              <UserCheck className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Team Earnings</p>
                <p className="text-2xl font-bold text-blue-600">₹{hierarchyData.teamMetrics.totalTeamEarnings.toFixed(2)}</p>
              </div>
              <DollarSign className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Recent Growth</p>
                <p className="text-2xl font-bold text-orange-600">{hierarchyData.growthMetrics.total}</p>
                <p className="text-xs text-gray-500">Last 30 days</p>
              </div>
              <TrendingUp className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Hierarchy Tree */}
      <Card>
        <CardHeader>
          <CardTitle>Team Hierarchy</CardTitle>
          <CardDescription>
            Your 3-tier referral network structure
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* A-Level */}
          <div className={`border rounded-lg p-4 ${getLevelColor('A_LEVEL')}`}>
            <div 
              className="flex items-center justify-between cursor-pointer"
              onClick={() => toggleLevel('A_LEVEL')}
            >
              <div className="flex items-center gap-3">
                {getLevelIcon('A_LEVEL')}
                <div>
                  <h3 className="font-semibold">{getLevelName('A_LEVEL')}</h3>
                  <p className="text-sm text-gray-600">
                    {hierarchyData.hierarchyStats.aLevelCount} members
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">
                  6% Bonus Rate
                </Badge>
                {expandedLevels.has('A_LEVEL') ? 
                  <ChevronDown className="w-5 h-5" /> : 
                  <ChevronRight className="w-5 h-5" />
                }
              </div>
            </div>

            {expandedLevels.has('A_LEVEL') && hierarchyData.subordinatesByLevel.aLevel.length > 0 && (
              <div className="mt-4 space-y-2">
                {hierarchyData.subordinatesByLevel.aLevel.slice(0, 5).map((member) => (
                  <div key={member.id} className="flex items-center justify-between bg-white p-3 rounded border">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${member.isActive ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                      <div>
                        <p className="font-medium">{member.name}</p>
                        <p className="text-sm text-gray-600">{member.currentPosition?.name || 'Intern'}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">₹{member.totalEarnings.toFixed(2)}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(member.joinedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
                {hierarchyData.subordinatesByLevel.aLevel.length > 5 && (
                  <p className="text-sm text-gray-600 text-center py-2">
                    +{hierarchyData.subordinatesByLevel.aLevel.length - 5} more members
                  </p>
                )}
              </div>
            )}
          </div>

          {/* B-Level */}
          <div className={`border rounded-lg p-4 ${getLevelColor('B_LEVEL')}`}>
            <div 
              className="flex items-center justify-between cursor-pointer"
              onClick={() => toggleLevel('B_LEVEL')}
            >
              <div className="flex items-center gap-3">
                {getLevelIcon('B_LEVEL')}
                <div>
                  <h3 className="font-semibold">{getLevelName('B_LEVEL')}</h3>
                  <p className="text-sm text-gray-600">
                    {hierarchyData.hierarchyStats.bLevelCount} members
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">
                  3% Bonus Rate
                </Badge>
                {expandedLevels.has('B_LEVEL') ? 
                  <ChevronDown className="w-5 h-5" /> : 
                  <ChevronRight className="w-5 h-5" />
                }
              </div>
            </div>

            {expandedLevels.has('B_LEVEL') && hierarchyData.subordinatesByLevel.bLevel.length > 0 && (
              <div className="mt-4 space-y-2">
                {hierarchyData.subordinatesByLevel.bLevel.slice(0, 3).map((member) => (
                  <div key={member.id} className="flex items-center justify-between bg-white p-3 rounded border">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${member.isActive ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                      <div>
                        <p className="font-medium">{member.name}</p>
                        <p className="text-sm text-gray-600">{member.currentPosition?.name || 'Intern'}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">₹{member.totalEarnings.toFixed(2)}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(member.joinedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
                {hierarchyData.subordinatesByLevel.bLevel.length > 3 && (
                  <p className="text-sm text-gray-600 text-center py-2">
                    +{hierarchyData.subordinatesByLevel.bLevel.length - 3} more members
                  </p>
                )}
              </div>
            )}
          </div>

          {/* C-Level */}
          <div className={`border rounded-lg p-4 ${getLevelColor('C_LEVEL')}`}>
            <div 
              className="flex items-center justify-between cursor-pointer"
              onClick={() => toggleLevel('C_LEVEL')}
            >
              <div className="flex items-center gap-3">
                {getLevelIcon('C_LEVEL')}
                <div>
                  <h3 className="font-semibold">{getLevelName('C_LEVEL')}</h3>
                  <p className="text-sm text-gray-600">
                    {hierarchyData.hierarchyStats.cLevelCount} members
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">
                  1% Bonus Rate
                </Badge>
                {expandedLevels.has('C_LEVEL') ? 
                  <ChevronDown className="w-5 h-5" /> : 
                  <ChevronRight className="w-5 h-5" />
                }
              </div>
            </div>

            {expandedLevels.has('C_LEVEL') && hierarchyData.subordinatesByLevel.cLevel.length > 0 && (
              <div className="mt-4 space-y-2">
                {hierarchyData.subordinatesByLevel.cLevel.slice(0, 3).map((member) => (
                  <div key={member.id} className="flex items-center justify-between bg-white p-3 rounded border">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${member.isActive ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                      <div>
                        <p className="font-medium">{member.name}</p>
                        <p className="text-sm text-gray-600">{member.currentPosition?.name || 'Intern'}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">₹{member.totalEarnings.toFixed(2)}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(member.joinedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
                {hierarchyData.subordinatesByLevel.cLevel.length > 3 && (
                  <p className="text-sm text-gray-600 text-center py-2">
                    +{hierarchyData.subordinatesByLevel.cLevel.length - 3} more members
                  </p>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Position Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Position Distribution</CardTitle>
          <CardDescription>
            Distribution of team members across position levels
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(hierarchyData.positionDistribution).map(([position, count]) => (
              <div key={position} className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-2xl font-bold text-blue-600">{count}</p>
                <p className="text-sm text-gray-600">{position}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
