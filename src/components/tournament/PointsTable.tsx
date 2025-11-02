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
  const [displayMode, setDisplayMode] = useState<'grouped' | 'ungrouped'>('grouped');

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
  const isSquadTournament = teamSizeNum === 4;
  const supportsGrouping = is5ManTournament || isSquadTournament;

  useEffect(() => {
    if (isTeamTournament && tournamentId) {
      loadPointsTable();
      loadDisplayMode();

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

  const loadDisplayMode = async () => {
    try {
      const { data, error } = await supabase
        .from('tournaments')
        .select('points_display_mode')
        .eq('id', tournamentId)
        .single();

      if (error) throw error;
      setDisplayMode((data?.points_display_mode as 'grouped' | 'ungrouped') || 'grouped');
    } catch (error) {
      console.error('Error loading display mode:', error);
    }
  };

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

      // For tournaments with grouping, sort by group_name then position_in_group
      let sortedData = pointsData || [];
      if (supportsGrouping && sortedData.some(entry => entry.group_name)) {
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

  // Group entries by group_name for tournaments with grouping and assign group positions
  const groupedEntries = supportsGrouping 
    ? pointsEntries.reduce((acc, entry) => {
        const groupName = entry.group_name || 'Ungrouped';
        if (!acc[groupName]) acc[groupName] = [];
        acc[groupName].push(entry);
        return acc;
      }, {} as Record<string, PointsEntry[]>)
    : {};

  // Sort entries within each group by points (descending) and assign group position
  Object.keys(groupedEntries).forEach(groupName => {
    groupedEntries[groupName].sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.kills !== a.kills) return b.kills - a.kills;
      return b.wins - a.wins;
    });
    // Assign position within group
    groupedEntries[groupName].forEach((entry, index) => {
      entry.position_in_group = index + 1;
    });
  });

  const hasGroups = supportsGrouping && Object.keys(groupedEntries).length > 0 && 
                    pointsEntries.some(entry => entry.group_name);

  // Render grouped display for tournaments with groups and grouped display mode
  if (hasGroups && displayMode === 'grouped') {
    return (
      <div className="space-y-6">
        {Object.entries(groupedEntries).sort(([a], [b]) => a.localeCompare(b)).map(([groupName, entries]) => (
          <Card 
            key={groupName}
            className="bg-gray-900/95 border-2 border-gray-700 backdrop-blur-sm overflow-hidden shadow-xl"
          >
            <CardHeader className="bg-gradient-to-r from-gray-800 to-gray-900 border-b border-gray-700">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-3 text-white text-2xl font-bold">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg flex items-center justify-center shadow-lg">
                    <Trophy className="w-6 h-6 text-white" />
                  </div>
                  {groupName}
                </CardTitle>
                <Badge variant="secondary" className="text-sm font-semibold bg-gray-800 text-white border border-gray-600">
                  {entries.length} Teams
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0 bg-gray-900">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-b-2 border-gray-700 hover:bg-gray-800/50 bg-gray-800">
                      <TableHead className="text-gray-100 font-bold text-base">Position</TableHead>
                      <TableHead className="text-gray-100 font-bold text-base">Team Name</TableHead>
                      <TableHead className="text-gray-100 font-bold text-base">
                        <div className="flex items-center gap-2">
                          <Target className="w-4 h-4" />
                          Points
                        </div>
                      </TableHead>
                      <TableHead className="text-gray-100 font-bold text-base">
                        <div className="flex items-center gap-2">
                          <Zap className="w-4 h-4" />
                          Kills
                        </div>
                      </TableHead>
                      <TableHead className="text-gray-100 font-bold text-base">
                        <div className="flex items-center gap-2">
                          <Award className="w-4 h-4" />
                          Wins
                        </div>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {entries.map((entry) => {
                      const groupPosition = entry.position_in_group || 1;
                      return (
                        <TableRow 
                          key={entry.id} 
                          className="border-b border-gray-800 transition-all duration-200 hover:bg-gray-800/70 bg-gray-900/50"
                        >
                          <TableCell className="font-bold">
                            <div className="flex items-center gap-3 py-2">
                              {getPositionIcon(groupPosition)}
                              <span className="text-xl text-white font-bold">{groupPosition}</span>
                            </div>
                          </TableCell>
                          <TableCell className="font-semibold text-lg py-3">
                            <span className="text-white">{entry.team_name}</span>
                          </TableCell>
                          <TableCell className="py-3">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg flex items-center justify-center shadow-lg">
                                <Target className="w-5 h-5 text-white" />
                              </div>
                              <span className="text-2xl font-bold text-white">{entry.points}</span>
                            </div>
                          </TableCell>
                          <TableCell className="py-3">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 bg-gradient-to-br from-red-500 to-orange-600 rounded-lg flex items-center justify-center shadow-lg">
                                <Zap className="w-5 h-5 text-white" />
                              </div>
                              <span className="text-xl font-semibold text-white">{entry.kills}</span>
                            </div>
                          </TableCell>
                          <TableCell className="py-3">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center shadow-lg">
                                <Award className="w-5 h-5 text-white" />
                              </div>
                              <span className="text-xl font-semibold text-white">{entry.wins}</span>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // Default display for tournaments without groups or ungrouped mode
  return (
    <Card className="bg-gray-900/95 border-2 border-gray-700 backdrop-blur-sm overflow-hidden shadow-xl">
      <CardHeader className="bg-gradient-to-r from-gray-800 to-gray-900 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-3 text-white text-2xl font-bold">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg flex items-center justify-center shadow-lg">
                <Trophy className="w-6 h-6 text-white" />
              </div>
              Live Points Table
            </CardTitle>
            <p className="text-gray-300 mt-1 font-medium">Real-time tournament standings</p>
          </div>
          {lastUpdated && (
            <Badge variant="secondary" className="text-xs bg-gray-800 text-white border border-gray-600">
              <span className="inline-block w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse" />
              Updated {lastUpdated.toLocaleTimeString()}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-0 bg-gray-900">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-b-2 border-gray-700 hover:bg-gray-800/50 bg-gray-800">
                <TableHead className="text-gray-100 font-bold text-base">Position</TableHead>
                <TableHead className="text-gray-100 font-bold text-base">Team Name</TableHead>
                <TableHead className="text-gray-100 font-bold text-base">
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4" />
                    Points
                  </div>
                </TableHead>
                <TableHead className="text-gray-100 font-bold text-base">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4" />
                    Kills
                  </div>
                </TableHead>
                <TableHead className="text-gray-100 font-bold text-base">
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
                  className="border-b border-gray-800 transition-all duration-200 hover:bg-gray-800/70 bg-gray-900/50"
                >
                  <TableCell className="font-bold">
                    <div className="flex items-center gap-3 py-2">
                      {getPositionIcon(entry.position)}
                      <span className="text-xl text-white font-bold">{entry.position}</span>
                    </div>
                  </TableCell>
                  <TableCell className="font-semibold text-lg py-3">
                    <span className="text-white">{entry.team_name}</span>
                  </TableCell>
                  <TableCell className="py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg flex items-center justify-center shadow-lg">
                        <Target className="w-5 h-5 text-white" />
                      </div>
                      <span className="text-2xl font-bold text-white">{entry.points}</span>
                    </div>
                  </TableCell>
                  <TableCell className="py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-gradient-to-br from-red-500 to-orange-600 rounded-lg flex items-center justify-center shadow-lg">
                        <Zap className="w-5 h-5 text-white" />
                      </div>
                      <span className="text-xl font-semibold text-white">{entry.kills}</span>
                    </div>
                  </TableCell>
                  <TableCell className="py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center shadow-lg">
                        <Award className="w-5 h-5 text-white" />
                      </div>
                      <span className="text-xl font-semibold text-white">{entry.wins}</span>
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
