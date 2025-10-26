import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Trophy, Edit, Save, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface PointsTableEntry {
  id: string;
  tournament_id: string;
  team_id: string;
  team_name: string;
  points: number;
  position: number;
  kills: number;
  wins: number;
  group_name?: string | null;
  position_in_group?: number | null;
  created_at: string;
  updated_at: string;
}

interface PointsTableAdminProps {
  tournaments: any[];
}

const PointsTableAdmin: React.FC<PointsTableAdminProps> = ({ tournaments }) => {
  const { toast } = useToast();
  const [selectedTournament, setSelectedTournament] = useState<string>('');
  const [pointsEntries, setPointsEntries] = useState<PointsTableEntry[]>([]);
  const [editingEntry, setEditingEntry] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    points: '',
    kills: '',
    wins: '',
    group_name: ''
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [numberOfGroups, setNumberOfGroups] = useState<number>(4);

  // Helper function to detect 5-Man Team tournament
  const is5ManTeamTournament = (tournament: any): boolean => {
    if (!tournament?.team_size) return false;
    const sizeStr = String(tournament.team_size).toLowerCase().trim();
    return sizeStr.includes('5') || sizeStr.includes('five') || sizeStr.includes('5-man');
  };

  const selectedTournamentData = tournaments.find(t => t.id === selectedTournament);
  const is5ManTournament = selectedTournamentData ? is5ManTeamTournament(selectedTournamentData) : false;

  // Filter tournaments to only show team tournaments
  const teamTournaments = tournaments.filter(t => 
    t.team_size && (typeof t.team_size === 'number' ? t.team_size > 1 : 
      ['duo', 'squad', '5-man', '5-Man team'].some(size => 
        String(t.team_size).toLowerCase().includes(size.toLowerCase())
      ))
  );

  useEffect(() => {
    if (selectedTournament) {
      loadPointsTable();
    }
  }, [selectedTournament]);

  const loadPointsTable = async () => {
    if (!selectedTournament) return;
    
    setLoading(true);
    try {
      // Get all teams for this tournament
      const { data: teams, error: teamsError } = await supabase
        .from('tournament_teams')
        .select('id, team_name')
        .eq('tournament_id', selectedTournament);

      if (teamsError) throw teamsError;

      if (!teams || teams.length === 0) {
        setPointsEntries([]);
        setLoading(false);
        return;
      }

      // Fetch existing points entries
      const { data: existingPoints, error: pointsError } = await supabase
        .from('tournament_points')
        .select('*')
        .eq('tournament_id', selectedTournament)
        .order('position', { ascending: true });

      if (pointsError) throw pointsError;

      // Create a map of existing points by team_id
      const pointsMap = new Map(
        existingPoints?.map(p => [p.team_id, p]) || []
      );

      // Identify teams without points entries
      const teamsNeedingPoints = teams.filter(team => !pointsMap.has(team.id));
      
      if (teamsNeedingPoints.length > 0) {
        // Create new points entries for teams that don't have them
        const newPointsEntries = teamsNeedingPoints.map((team, idx) => ({
          tournament_id: selectedTournament,
          team_id: team.id,
          team_name: team.team_name,
          points: 0,
          kills: 0,
          wins: 0,
          position: (existingPoints?.length || 0) + idx + 1,
        }));

        const { error: insertError } = await supabase
          .from('tournament_points')
          .insert(newPointsEntries);

        if (insertError) throw insertError;

        // Reload after insertion
        const { data: refreshedPoints } = await supabase
          .from('tournament_points')
          .select('*')
          .eq('tournament_id', selectedTournament)
          .order('position', { ascending: true });

        setPointsEntries(refreshedPoints || []);
      } else {
        setPointsEntries(existingPoints || []);
      }
    } catch (error) {
      console.error('Error loading points table:', error);
      toast({
        title: "Error",
        description: "Failed to load points table",
        variant: "destructive"
      });
      setPointsEntries([]);
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (entry: PointsTableEntry) => {
    setEditingEntry(entry.id);
    setEditForm({
      points: entry.points.toString(),
      kills: entry.kills.toString(),
      wins: entry.wins.toString(),
      group_name: entry.group_name || ''
    });
  };

  const cancelEdit = () => {
    setEditingEntry(null);
    setEditForm({ points: '', kills: '', wins: '', group_name: '' });
  };

  const saveEdit = async (entryId: string) => {
    setSaving(true);
    try {
      const updateData: any = {
        points: parseInt(editForm.points) || 0,
        kills: parseInt(editForm.kills) || 0,
        wins: parseInt(editForm.wins) || 0,
      };

      // Only add group_name for 5-Man tournaments
      if (is5ManTournament) {
        updateData.group_name = editForm.group_name || null;
      }

      const { error } = await supabase
        .from('tournament_points')
        .update(updateData)
        .eq('id', entryId);

      if (error) throw error;

      // Update local state
      setPointsEntries(prev => prev.map(entry => 
        entry.id === entryId 
          ? {
              ...entry,
              points: parseInt(editForm.points) || 0,
              kills: parseInt(editForm.kills) || 0,
              wins: parseInt(editForm.wins) || 0,
              group_name: is5ManTournament ? (editForm.group_name || null) : entry.group_name,
              updated_at: new Date().toISOString()
            }
          : entry
      ));

      toast({
        title: "Success",
        description: "Points updated successfully"
      });

      cancelEdit();
    } catch (error) {
      console.error('Error updating points:', error);
      toast({
        title: "Error",
        description: "Failed to update points",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const autoCalculatePositions = async () => {
    if (!selectedTournament || pointsEntries.length === 0) return;

    setSaving(true);
    try {
      let updates: any[] = [];

      if (is5ManTournament) {
        // For 5-Man tournaments, calculate both overall and in-group positions
        // First, sort all entries for overall position
        const sortedEntries = [...pointsEntries].sort((a, b) => {
          if (b.points !== a.points) return b.points - a.points;
          return b.kills - a.kills;
        });

        // Group entries by group_name
        const groupedEntries = sortedEntries.reduce((acc, entry) => {
          const groupName = entry.group_name || 'Ungrouped';
          if (!acc[groupName]) acc[groupName] = [];
          acc[groupName].push(entry);
          return acc;
        }, {} as Record<string, PointsTableEntry[]>);

        // Calculate position_in_group for each group
        Object.entries(groupedEntries).forEach(([groupName, entries]) => {
          entries.forEach((entry, index) => {
            const overallIndex = sortedEntries.findIndex(e => e.id === entry.id);
            updates.push({
              id: entry.id,
              tournament_id: entry.tournament_id,
              team_id: entry.team_id,
              team_name: entry.team_name,
              points: entry.points,
              kills: entry.kills,
              wins: entry.wins,
              group_name: entry.group_name,
              position: overallIndex + 1,
              position_in_group: index + 1
            });
          });
        });
      } else {
        // For Squad/Duo tournaments, only calculate overall position
        const sortedEntries = [...pointsEntries].sort((a, b) => {
          if (b.points !== a.points) return b.points - a.points;
          return b.kills - a.kills;
        });

        updates = sortedEntries.map((entry, index) => ({
          id: entry.id,
          tournament_id: entry.tournament_id,
          team_id: entry.team_id,
          team_name: entry.team_name,
          points: entry.points,
          kills: entry.kills,
          wins: entry.wins,
          position: index + 1
        }));
      }

      // Update all positions in database
      const { error } = await supabase
        .from('tournament_points')
        .upsert(updates);

      if (error) throw error;

      // Reload data to reflect changes
      await loadPointsTable();

      toast({
        title: "Success",
        description: "Positions calculated and saved successfully"
      });
    } catch (error) {
      console.error('Error calculating positions:', error);
      toast({
        title: "Error",
        description: "Failed to calculate positions",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const autoAssignGroups = async () => {
    if (!selectedTournament || pointsEntries.length === 0) return;

    setSaving(true);
    try {
      const groups = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'].slice(0, numberOfGroups);
      
      // Distribute teams evenly across groups
      const updates = pointsEntries.map((entry, index) => ({
        ...entry,
        group_name: `Group ${groups[index % numberOfGroups]}`
      }));

      const { error } = await supabase
        .from('tournament_points')
        .upsert(updates.map(entry => ({
          id: entry.id,
          tournament_id: entry.tournament_id,
          team_id: entry.team_id,
          team_name: entry.team_name,
          points: entry.points,
          kills: entry.kills,
          wins: entry.wins,
          position: entry.position,
          group_name: entry.group_name
        })));

      if (error) throw error;

      setPointsEntries(updates);

      toast({
        title: "Success",
        description: `Teams assigned to ${numberOfGroups} groups`
      });
    } catch (error) {
      console.error('Error assigning groups:', error);
      toast({
        title: "Error",
        description: "Failed to assign groups",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="bg-gray-800/50 border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Trophy className="w-5 h-5" />
            Points Table Management
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div className="flex gap-4 items-end">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Select Tournament (Team tournaments only)
                </label>
                <Select value={selectedTournament} onValueChange={setSelectedTournament}>
                  <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                    <SelectValue placeholder="Choose a team tournament" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-700 border-gray-600">
                    {teamTournaments.map((tournament) => (
                      <SelectItem key={tournament.id} value={tournament.id} className="text-white">
                        {tournament.name} ({tournament.team_size || 'team'})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                onClick={autoCalculatePositions}
                disabled={!selectedTournament || loading || saving || pointsEntries.length === 0}
                className="bg-purple-600 hover:bg-purple-700"
              >
                {saving ? 'Calculating...' : 'Auto Calculate Positions'}
              </Button>
            </div>

            {is5ManTournament && selectedTournament && (
              <div className="flex gap-4 items-end p-4 bg-blue-900/20 border border-blue-700/30 rounded-lg">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-blue-300 mb-2">
                    5-Man Team Group Management
                  </label>
                  <p className="text-xs text-blue-200 mb-2">Assign teams to groups (Group A, B, C, etc.)</p>
                </div>
                <div className="w-32">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    # of Groups
                  </label>
                  <Input
                    type="number"
                    min="2"
                    max="8"
                    value={numberOfGroups}
                    onChange={(e) => setNumberOfGroups(parseInt(e.target.value) || 4)}
                    className="bg-gray-700 border-gray-600 text-white"
                  />
                </div>
                <Button
                  onClick={autoAssignGroups}
                  disabled={loading || saving || pointsEntries.length === 0}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Auto-assign Groups
                </Button>
              </div>
            )}
          </div>

          {selectedTournament && (
            <Card className="bg-gray-900/50 border-gray-600">
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="border-gray-600">
                      <TableHead className="text-gray-300">Position</TableHead>
                      <TableHead className="text-gray-300">Team Name</TableHead>
                      {is5ManTournament && <TableHead className="text-gray-300">Group</TableHead>}
                      <TableHead className="text-gray-300">Points</TableHead>
                      <TableHead className="text-gray-300">Kills</TableHead>
                      <TableHead className="text-gray-300">Wins</TableHead>
                      <TableHead className="text-gray-300">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-gray-400 py-8">
                          Loading points table...
                        </TableCell>
                      </TableRow>
                    ) : pointsEntries.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={is5ManTournament ? 7 : 6} className="text-center text-gray-400 py-8">
                          No teams found for this tournament
                        </TableCell>
                      </TableRow>
                    ) : (
                      pointsEntries.map((entry) => (
                        <TableRow key={entry.id} className="border-gray-600">
                          <TableCell className="text-white font-bold">
                            <div className="flex items-center gap-2">
                              {entry.position === 1 && <Trophy className="w-4 h-4 text-yellow-500" />}
                              {entry.position === 2 && <Trophy className="w-4 h-4 text-gray-400" />}
                              {entry.position === 3 && <Trophy className="w-4 h-4 text-amber-600" />}
                              #{entry.position}
                            </div>
                          </TableCell>
                          <TableCell className="text-white font-medium">
                            {entry.team_name}
                          </TableCell>
                          {is5ManTournament && (
                            <TableCell className="text-white">
                              {editingEntry === entry.id ? (
                                <Select 
                                  value={editForm.group_name} 
                                  onValueChange={(value) => setEditForm({...editForm, group_name: value})}
                                >
                                  <SelectTrigger className="w-32 bg-gray-700 border-gray-600 text-white">
                                    <SelectValue placeholder="Select group" />
                                  </SelectTrigger>
                                  <SelectContent className="bg-gray-700 border-gray-600">
                                    {['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'].slice(0, numberOfGroups).map((group) => (
                                      <SelectItem key={group} value={`Group ${group}`} className="text-white">
                                        Group {group}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              ) : (
                                entry.group_name || '-'
                              )}
                            </TableCell>
                          )}
                          <TableCell className="text-white">
                            {editingEntry === entry.id ? (
                              <Input
                                type="number"
                                min="0"
                                value={editForm.points}
                                onChange={(e) => setEditForm({...editForm, points: e.target.value})}
                                className="w-24 bg-gray-700 border-gray-600 text-white"
                              />
                            ) : (
                              entry.points
                            )}
                          </TableCell>
                          <TableCell className="text-white">
                            {editingEntry === entry.id ? (
                              <Input
                                type="number"
                                min="0"
                                value={editForm.kills}
                                onChange={(e) => setEditForm({...editForm, kills: e.target.value})}
                                className="w-24 bg-gray-700 border-gray-600 text-white"
                              />
                            ) : (
                              entry.kills
                            )}
                          </TableCell>
                          <TableCell className="text-white">
                            {editingEntry === entry.id ? (
                              <Input
                                type="number"
                                min="0"
                                value={editForm.wins}
                                onChange={(e) => setEditForm({...editForm, wins: e.target.value})}
                                className="w-24 bg-gray-700 border-gray-600 text-white"
                              />
                            ) : (
                              entry.wins
                            )}
                          </TableCell>
                          <TableCell>
                            {editingEntry === entry.id ? (
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  onClick={() => saveEdit(entry.id)}
                                  disabled={saving}
                                  className="bg-green-600 hover:bg-green-700"
                                >
                                  <Save className="w-4 h-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={cancelEdit}
                                  disabled={saving}
                                  className="border-gray-600 text-gray-300 hover:bg-gray-700"
                                >
                                  <X className="w-4 h-4" />
                                </Button>
                              </div>
                            ) : (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => startEdit(entry)}
                                disabled={saving}
                                className="border-gray-600 text-gray-300 hover:bg-gray-700"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PointsTableAdmin;
