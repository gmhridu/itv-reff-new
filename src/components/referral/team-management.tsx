'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Users, 
  Search, 
  Filter,
  UserCheck,
  UserX,
  TrendingUp,
  Calendar,
  DollarSign,
  Activity,
  Crown,
  Star,
  Award
} from 'lucide-react';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  level: 'A_LEVEL' | 'B_LEVEL' | 'C_LEVEL';
  joinedAt: string;
  lastActivity: string | null;
  activityStatus: 'very_active' | 'active' | 'moderate' | 'inactive';
  daysSinceLastActivity: number | null;
  isActive: boolean;
  currentPosition: {
    name: string;
    level: number;
    unitPrice: number;
    dailyTaskLimit: number;
  } | null;
  performance: {
    totalEarnings: number;
    walletBalance: number;
    weeklyTaskCount: number;
    weeklyEarnings: number;
    averageDailyTasks: number;
  };
}

interface TeamData {
  teamMembers: TeamMember[];
  teamStats: {
    totalMembers: number;
    activeMembers: number;
    veryActiveMembers: number;
    inactiveMembers: number;
    totalTeamEarnings: number;
    averageEarningsPerMember: number;
  };
  positionDistribution: Record<string, number>;
  topPerformers: TeamMember[];
  pagination: {
    limit: number;
    offset: number;
    total: number;
    hasMore: boolean;
  };
}

export default function TeamManagement() {
  const [teamData, setTeamData] = useState<TeamData | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [levelFilter, setLevelFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    fetchTeamData();
  }, [levelFilter, statusFilter]);

  const fetchTeamData = async () => {
    try {
      const params = new URLSearchParams();
      if (levelFilter !== 'all') params.append('level', levelFilter);
      
      const response = await fetch(`/api/referrals/team?${params.toString()}`);
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setTeamData(result.data);
        }
      }
    } catch (error) {
      console.error('Error fetching team data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActivityStatusBadge = (status: string) => {
    switch (status) {
      case 'very_active':
        return <Badge className="bg-green-100 text-green-800">Very Active</Badge>;
      case 'active':
        return <Badge className="bg-blue-100 text-blue-800">Active</Badge>;
      case 'moderate':
        return <Badge className="bg-yellow-100 text-yellow-800">Moderate</Badge>;
      case 'inactive':
        return <Badge className="bg-red-100 text-red-800">Inactive</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'A_LEVEL':
        return <Crown className="w-4 h-4 text-yellow-500" />;
      case 'B_LEVEL':
        return <Star className="w-4 h-4 text-blue-500" />;
      case 'C_LEVEL':
        return <Users className="w-4 h-4 text-green-500" />;
      default:
        return <Users className="w-4 h-4 text-gray-500" />;
    }
  };

  const getLevelName = (level: string) => {
    switch (level) {
      case 'A_LEVEL':
        return 'A-Level';
      case 'B_LEVEL':
        return 'B-Level';
      case 'C_LEVEL':
        return 'C-Level';
      default:
        return level;
    }
  };

  const filteredMembers = teamData?.teamMembers.filter(member => {
    const matchesSearch = member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         member.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'active' && member.isActive) ||
                         (statusFilter === 'inactive' && !member.isActive);
    return matchesSearch && matchesStatus;
  }) || [];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!teamData) {
    return (
      <div className="text-center py-12">
        <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">No Team Data</h3>
        <p className="text-gray-600">Start building your team to see management tools here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Team Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Members</p>
                <p className="text-2xl font-bold">{teamData.teamStats.totalMembers}</p>
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
                <p className="text-2xl font-bold text-green-600">{teamData.teamStats.activeMembers}</p>
              </div>
              <UserCheck className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Very Active</p>
                <p className="text-2xl font-bold text-blue-600">{teamData.teamStats.veryActiveMembers}</p>
              </div>
              <Activity className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Earnings</p>
                <p className="text-2xl font-bold text-orange-600">₹{teamData.teamStats.averageEarningsPerMember.toFixed(0)}</p>
              </div>
              <DollarSign className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Performers */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="w-5 h-5" />
            Top Performers This Week
          </CardTitle>
          <CardDescription>
            Team members with highest weekly earnings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {teamData.topPerformers.slice(0, 5).map((performer, index) => (
              <div key={performer.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full">
                    <span className="text-sm font-bold text-blue-600">#{index + 1}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {getLevelIcon(performer.level)}
                    <div>
                      <p className="font-medium">{performer.name}</p>
                      <p className="text-sm text-gray-600">{performer.currentPosition?.name || 'Intern'}</p>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-green-600">₹{performer.performance.weeklyEarnings.toFixed(2)}</p>
                  <p className="text-sm text-gray-600">{performer.performance.weeklyTaskCount} tasks</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle>Team Members</CardTitle>
          <CardDescription>
            Manage and monitor your team members
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={levelFilter} onValueChange={setLevelFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filter by level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                <SelectItem value="A_LEVEL">A-Level</SelectItem>
                <SelectItem value="B_LEVEL">B-Level</SelectItem>
                <SelectItem value="C_LEVEL">C-Level</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Team Members List */}
          <div className="space-y-4">
            {filteredMembers.map((member) => (
              <div key={member.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      {getLevelIcon(member.level)}
                      <Badge variant="outline">{getLevelName(member.level)}</Badge>
                    </div>
                    <div>
                      <h3 className="font-semibold">{member.name}</h3>
                      <p className="text-sm text-gray-600">{member.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    {getActivityStatusBadge(member.activityStatus)}
                    <div className="text-right">
                      <p className="font-semibold">₹{member.performance.totalEarnings.toFixed(2)}</p>
                      <p className="text-sm text-gray-600">Total Earnings</p>
                    </div>
                  </div>
                </div>
                
                <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Position</p>
                    <p className="font-medium">{member.currentPosition?.name || 'Intern'}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Weekly Tasks</p>
                    <p className="font-medium">{member.performance.weeklyTaskCount}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Weekly Earnings</p>
                    <p className="font-medium text-green-600">₹{member.performance.weeklyEarnings.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Last Activity</p>
                    <p className="font-medium">
                      {member.daysSinceLastActivity !== null 
                        ? `${member.daysSinceLastActivity} days ago`
                        : 'Never'
                      }
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredMembers.length === 0 && (
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No team members found matching your criteria.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
