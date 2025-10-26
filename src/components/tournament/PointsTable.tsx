import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Trophy, Target, Award, Zap } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface PointsEntry {
  id: string;
  team_name: string;
  points: number;
  position: number;
  kills: number;
  wins: number;
  group_name?: string | null;
  position_in_group?: number | null;
}

interface PointsTableProps {
  tournamentId: string;
  teamSize?: any;
}

const PointsTable: React.FC<PointsTableProps> = ({ tournamentId, teamSize }) => {
  const [pointsEntries, setPointsEntries] = useState<PointsEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Parse team size to determine if this is a team tournament
  const parseTeamSize = (size: any): number => {
    if (typeof size === 'number') return size;
    if (!size) return 1;
    
    const sizeStr = String(size).toLowerCase().trim();
    if (sizeStr.includes('duo') || sizeStr === '2') return 2;
    if (sizeStr.includes('squad') || sizeStr === '4') return 4;
    if (sizeStr.includes('5') || sizeStr.includes('five')) return 5;
    
    const num = parseInt(sizeStr);
    return isNaN(num) ? 1 : num;
  };

  const teamSizeNum = parseTeamSize(teamSize);
  const isTeamTournament = teamSizeNum > 1;
  const is5ManTournament = teamSizeNum === 5;

  useEffect(() => {
    if (isTeamTournament && tournamentId) {
      loadPointsTable();

      // Subscribe to real-time updates
      const channel = supabase
        .channel('tournament-points-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'tournament_points',
            filter: `tournament_id=eq.${tournamentId}`,
          },
          (payload) => {
            console.log('Points updated:', payload);
            loadPointsTable();
            setLastUpdated(new Date());
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [tournamentId, isTeamTournament]);

  const loadPointsTable = async () => {
    try {
      setLoading(true);

      // Fetch points data from database
      const { data: pointsData, error: pointsError } = await supabase
        .from('tournament_points')
        .select('*')
        .eq('tournament_id', tournamentId)
        .order(is5ManTournament ? 'group_name' : 'position', { ascending: true });

      if (pointsError) throw pointsError;

      // For 5-Man tournaments with groups, sort by group_name then position_in_group
      let sortedData = pointsData || [];
      if (is5ManTournament && sortedData.some(entry => entry.group_name)) {
        sortedData = sortedData.sort((a, b) => {
          if (a.group_name !== b.group_name) {
            return (a.group_name || 'Ungrouped').localeCompare(b.group_name || 'Ungrouped');
          }
          return (a.position_in_group || 0) - (b.position_in_group || 0);
        });
      }

      setPointsEntries(sortedData);
    } catch (error) {
      console.error('Error loading points table:', error);
      setPointsEntries([]);
    } finally {
      setLoading(false);
    }
  };

  // Don't render for solo tournaments
  if (!isTeamTournament) {
    return null;
  }

  const getPositionIcon = (position: number) => {
    switch (position) {
      case 1:
        return <Trophy className="w-5 h-5 text-yellow-500" />;
      case 2:
        return <Trophy className="w-5 h-5 text-gray-400" />;
      case 3:
        return <Trophy className="w-5 h-5 text-amber-600" />;
      default:
        return <div className="w-5 h-5 flex items-center justify-center text-gray-500 font-bold text-sm">#{position}</div>;
    }
  };

  const getPositionRowClass = (position: number) => {
    switch (position) {
      case 1:
        return "bg-gradient-to-r from-yellow-500/20 to-yellow-600/10 border-yellow-500/30";
      case 2:
        return "bg-gradient-to-r from-gray-400/20 to-gray-500/10 border-gray-400/30";
      case 3:
        return "bg-gradient-to-r from-amber-600/20 to-amber-700/10 border-amber-600/30";
      default:
        return "border-gray-600";
    }
  };

  const getGroupColor = (groupName: string) => {
    const colors: Record<string, string> = {
      'Group A': 'from-purple-600/20 to-purple-700/10',
      'Group B': 'from-blue-600/20 to-blue-700/10',
      'Group C': 'from-green-600/20 to-green-700/10',
      'Group D': 'from-orange-600/20 to-orange-700/10',
      'Group E': 'from-pink-600/20 to-pink-700/10',
      'Group F': 'from-cyan-600/20 to-cyan-700/10',
      'Group G': 'from-yellow-600/20 to-yellow-700/10',
      'Group H': 'from-red-600/20 to-red-700/10',
    };
    return colors[groupName] || 'from-gray-600/20 to-gray-700/10';
  };

  const getGroupBorderColor = (groupName: string) => {
    const colors: Record<string, string> = {
      'Group A': 'border-purple-500/50',
      'Group B': 'border-blue-500/50',
      'Group C': 'border-green-500/50',
      'Group D': 'border-orange-500/50',
      'Group E': 'border-pink-500/50',
      'Group F': 'border-cyan-500/50',
      'Group G': 'border-yellow-500/50',
      'Group H': 'border-red-500/50',
    };
    return colors[groupName] || 'border-gray-500/50';
  };

  if (loading) {
    return (
      <Card className="bg-gray-800/50 border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Trophy className="w-5 h-5" />
            Points Table
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-gray-400 py-8">
            Loading points table...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (pointsEntries.length === 0) {
    return (
      <Card className="bg-gray-800/50 border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Trophy className="w-5 h-5" />
            Points Table
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-gray-400 py-8">
            No points data available yet. Teams will appear here once the tournament begins.
          </div>
        </CardContent>
      </Card>
    );
  }

  // Group entries by group_name for 5-Man tournaments
  const groupedEntries = is5ManTournament 
    ? pointsEntries.reduce((acc, entry) => {
        const groupName = entry.group_name || 'Ungrouped';
        if (!acc[groupName]) acc[groupName] = [];
        acc[groupName].push(entry);
        return acc;
      }, {} as Record<string, PointsEntry[]>)
    : {};

  const hasGroups = is5ManTournament && Object.keys(groupedEntries).length > 0 && 
                    pointsEntries.some(entry => entry.group_name);

  // Render grouped display for 5-Man tournaments with groups
  if (hasGroups) {
    return (
      <div className="space-y-6">
        {Object.entries(groupedEntries).sort(([a], [b]) => a.localeCompare(b)).map(([groupName, entries]) => (
          <Card 
            key={groupName}
            className={`bg-gradient-to-br ${getGroupColor(groupName)} border ${getGroupBorderColor(groupName)} backdrop-blur-sm overflow-hidden`}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-purple-600/5 to-blue-600/5" />
            <CardHeader className="relative">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-3 text-white text-2xl">
                  <div className={`w-10 h-10 bg-gradient-to-br ${getGroupColor(groupName)} rounded-lg flex items-center justify-center border ${getGroupBorderColor(groupName)}`}>
                    <Trophy className="w-6 h-6 text-white" />
                  </div>
                  {groupName}
                </CardTitle>
                <Badge variant="outline" className="text-sm">
                  {entries.length} Teams
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="relative p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-gray-600 hover:bg-transparent">
                      <TableHead className="text-gray-300 font-bold">Position</TableHead>
                      <TableHead className="text-gray-300 font-bold">Team Name</TableHead>
                      <TableHead className="text-gray-300 font-bold">
                        <div className="flex items-center gap-2">
                          <Target className="w-4 h-4" />
                          Points
                        </div>
                      </TableHead>
                      <TableHead className="text-gray-300 font-bold">
                        <div className="flex items-center gap-2">
                          <Zap className="w-4 h-4" />
                          Kills
                        </div>
                      </TableHead>
                      <TableHead className="text-gray-300 font-bold">
                        <div className="flex items-center gap-2">
                          <Award className="w-4 h-4" />
                          Wins
                        </div>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {entries.map((entry) => (
                      <TableRow 
                        key={entry.id} 
                        className={`border transition-all duration-200 hover:bg-white/5 ${getPositionRowClass(entry.position_in_group || entry.position)}`}
                      >
                        <TableCell className="text-white font-bold">
                          <div className="flex items-center gap-3">
                            {getPositionIcon(entry.position_in_group || entry.position)}
                            <span className="text-lg">{entry.position_in_group || entry.position}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-white font-semibold text-lg">
                          {entry.team_name}
                        </TableCell>
                        <TableCell className="text-white">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full flex items-center justify-center">
                              <Target className="w-4 h-4 text-white" />
                            </div>
                            <span className="text-xl font-bold">{entry.points}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-white">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-orange-600 rounded-full flex items-center justify-center">
                              <Zap className="w-4 h-4 text-white" />
                            </div>
                            <span className="text-lg font-medium">{entry.kills}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-white">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
                              <Award className="w-4 h-4 text-white" />
                            </div>
                            <span className="text-lg font-medium">{entry.wins}</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // Default display for Squad/Duo tournaments or 5-Man without groups
  return (
    <Card className="bg-gradient-to-br from-gray-800/50 via-gray-900/30 to-purple-900/20 border-gray-700 backdrop-blur-sm overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-purple-600/5 to-blue-600/5" />
      <CardHeader className="relative">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-white text-2xl">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg flex items-center justify-center">
                <Trophy className="w-6 h-6 text-white" />
              </div>
              Live Points Table
            </CardTitle>
            <p className="text-gray-300 mt-1">Real-time tournament standings</p>
          </div>
          {lastUpdated && (
            <Badge variant="outline" className="text-xs">
              <span className="inline-block w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse" />
              Updated {lastUpdated.toLocaleTimeString()}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="relative p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-gray-600 hover:bg-transparent">
                <TableHead className="text-gray-300 font-bold">Position</TableHead>
                <TableHead className="text-gray-300 font-bold">Team Name</TableHead>
                <TableHead className="text-gray-300 font-bold">
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4" />
                    Points
                  </div>
                </TableHead>
                <TableHead className="text-gray-300 font-bold">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4" />
                    Kills
                  </div>
                </TableHead>
                <TableHead className="text-gray-300 font-bold">
                  <div className="flex items-center gap-2">
                    <Award className="w-4 h-4" />
                    Wins
                  </div>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pointsEntries.map((entry) => (
                <TableRow 
                  key={entry.id} 
                  className={`border transition-all duration-200 hover:bg-white/5 ${getPositionRowClass(entry.position)}`}
                >
                  <TableCell className="text-white font-bold">
                    <div className="flex items-center gap-3">
                      {getPositionIcon(entry.position)}
                      <span className="text-lg">{entry.position}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-white font-semibold text-lg">
                    {entry.team_name}
                  </TableCell>
                  <TableCell className="text-white">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full flex items-center justify-center">
                        <Target className="w-4 h-4 text-white" />
                      </div>
                      <span className="text-xl font-bold">{entry.points}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-white">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-orange-600 rounded-full flex items-center justify-center">
                        <Zap className="w-4 h-4 text-white" />
                      </div>
                      <span className="text-lg font-medium">{entry.kills}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-white">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
                        <Award className="w-4 h-4 text-white" />
                      </div>
                      <span className="text-lg font-medium">{entry.wins}</span>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default PointsTable;
