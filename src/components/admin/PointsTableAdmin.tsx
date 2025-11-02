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
    position: '',
    group_name: ''
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [numberOfGroups, setNumberOfGroups] = useState<number>(4);
  const [displayMode, setDisplayMode] = useState<'grouped' | 'ungrouped'>('grouped');
  const [selectedTeamForGroup, setSelectedTeamForGroup] = useState<string>('');
  const [selectedGroupForTeam, setSelectedGroupForTeam] = useState<string>('');

  // Helper function to detect 5-Man Team tournament
  const is5ManTeamTournament = (tournament: any): boolean => {
    if (!tournament?.team_size) return false;
    const sizeStr = String(tournament.team_size).toLowerCase().trim();
    return sizeStr.includes('5') || sizeStr.includes('five') || sizeStr.includes('5-man');
  };

  // Helper function to detect Squad tournament
  const isSquadTournament = (tournament: any): boolean => {
    if (!tournament?.team_size) return false;
    const sizeStr = String(tournament.team_size).toLowerCase().trim();
    return sizeStr.includes('squad') || sizeStr === '4';
  };

  const selectedTournamentData = tournaments.find(t => t.id === selectedTournament);
  const is5ManTournament = selectedTournamentData ? is5ManTeamTournament(selectedTournamentData) : false;
  const isSquad = selectedTournamentData ? isSquadTournament(selectedTournamentData) : false;
  const supportsGrouping = is5ManTournament || isSquad;

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
      loadDisplayMode();
    }
  }, [selectedTournament]);

  const loadDisplayMode = async () => {
    if (!selectedTournament) return;
    
    try {
      const { data, error } = await supabase
        .from('tournaments')
        .select('points_display_mode')
        .eq('id', selectedTournament)
        .single();

      if (error) throw error;
      setDisplayMode((data?.points_display_mode as 'grouped' | 'ungrouped') || 'grouped');
    } catch (error) {
      console.error('Error loading display mode:', error);
    }
  };

  const updateDisplayMode = async (mode: 'grouped' | 'ungrouped') => {
    if (!selectedTournament) return;
    
    try {
      const { error } = await supabase
        .from('tournaments')
        .update({ points_display_mode: mode })
        .eq('id', selectedTournament);

      if (error) throw error;

      setDisplayMode(mode);
      toast({
        title: "Success",
        description: `Display mode changed to ${mode}`
      });
    } catch (error) {
      console.error('Error updating display mode:', error);
      toast({
        title: "Error",
        description: "Failed to update display mode",
        variant: "destructive"
      });
    }
  };

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
      position: entry.position.toString(),
      group_name: entry.group_name || ''
    });
  };

  const cancelEdit = () => {
    setEditingEntry(null);
    setEditForm({ points: '', kills: '', wins: '', position: '', group_name: '' });
  };

  const saveEdit = async (entryId: string) => {
    setSaving(true);
    try {
      const updateData: any = {
        points: parseInt(editForm.points) || 0,
        kills: parseInt(editForm.kills) || 0,
        wins: parseInt(editForm.wins) || 0,
        position: parseInt(editForm.position) || 1,
      };

      // Only add group_name for tournaments that support grouping
      if (supportsGrouping) {
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
              position: parseInt(editForm.position) || 1,
              group_name: supportsGrouping ? (editForm.group_name || null) : entry.group_name,
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

      if (supportsGrouping) {
        // For tournaments with grouping, calculate both overall and in-group positions
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
        // For other tournaments, only calculate overall position
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

  const manuallyAssignTeamToGroup = async () => {
    if (!selectedTeamForGroup || !selectedGroupForTeam) {
      toast({
        title: "Error",
        description: "Please select both a team and a group",
        variant: "destructive"
      });
      return;
    }

    setSaving(true);
    try {
      const entry = pointsEntries.find(e => e.team_id === selectedTeamForGroup);
      if (!entry) throw new Error('Team not found');

      const { error } = await supabase
        .from('tournament_points')
        .update({ group_name: selectedGroupForTeam })
        .eq('id', entry.id);

      if (error) throw error;

      // Update local state
      setPointsEntries(prev => prev.map(e => 
        e.team_id === selectedTeamForGroup 
          ? { ...e, group_name: selectedGroupForTeam }
          : e
      ));

      toast({
        title: "Success",
        description: `Team assigned to ${selectedGroupForTeam}`
      });

      // Reset selections
      setSelectedTeamForGroup('');
      setSelectedGroupForTeam('');
    } catch (error) {
      console.error('Error assigning team to group:', error);
      toast({
        title: "Error",
        description: "Failed to assign team to group",
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

            {supportsGrouping && selectedTournament && (
              <div className="space-y-4">
                <div className="flex gap-4 items-center p-4 bg-indigo-900/20 border border-indigo-700/30 rounded-lg">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-indigo-300 mb-1">
                      Display Mode
                    </label>
                    <p className="text-xs text-indigo-200">Choose how points table is displayed to participants</p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => updateDisplayMode('grouped')}
                      disabled={loading || saving}
                      variant={displayMode === 'grouped' ? 'default' : 'outline'}
                      className={displayMode === 'grouped' ? 'bg-indigo-600 hover:bg-indigo-700' : 'border-gray-600 text-gray-300 hover:bg-gray-700'}
                    >
                      Grouped
                    </Button>
                    <Button
                      onClick={() => updateDisplayMode('ungrouped')}
                      disabled={loading || saving}
                      variant={displayMode === 'ungrouped' ? 'default' : 'outline'}
                      className={displayMode === 'ungrouped' ? 'bg-indigo-600 hover:bg-indigo-700' : 'border-gray-600 text-gray-300 hover:bg-gray-700'}
                    >
                      Single Table
                    </Button>
                  </div>
                </div>
                <div className="flex gap-4 items-end p-4 bg-blue-900/20 border border-blue-700/30 rounded-lg">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-blue-300 mb-2">
                      Group Management
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

                <div className="p-4 bg-green-900/20 border border-green-700/30 rounded-lg space-y-3">
                  <label className="block text-sm font-medium text-green-300">
                    Manual Team Assignment
                  </label>
                  <p className="text-xs text-green-200">Assign individual teams to specific groups</p>
                  <div className="flex gap-4 items-end">
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Select Team
                      </label>
                      <Select value={selectedTeamForGroup} onValueChange={setSelectedTeamForGroup}>
                        <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                          <SelectValue placeholder="Choose a team" />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-700 border-gray-600">
                          {pointsEntries.map((entry) => (
                            <SelectItem key={entry.team_id} value={entry.team_id} className="text-white">
                              {entry.team_name} {entry.group_name && `(${entry.group_name})`}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Assign to Group
                      </label>
                      <Select value={selectedGroupForTeam} onValueChange={setSelectedGroupForTeam}>
                        <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                          <SelectValue placeholder="Choose a group" />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-700 border-gray-600">
                          {['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'].slice(0, numberOfGroups).map((group) => (
                            <SelectItem key={group} value={`Group ${group}`} className="text-white">
                              Group {group}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button
                      onClick={manuallyAssignTeamToGroup}
                      disabled={!selectedTeamForGroup || !selectedGroupForTeam || saving}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      Assign Team
                    </Button>
                  </div>
                </div>
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
                      {supportsGrouping && <TableHead className="text-gray-300">Group</TableHead>}
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
                            {editingEntry === entry.id ? (
                              <Input
                                type="number"
                                min="1"
                                value={editForm.position}
                                onChange={(e) => setEditForm({...editForm, position: e.target.value})}
                                className="w-20 bg-gray-700 border-gray-600 text-white"
                              />
                            ) : (
                              <div className="flex items-center gap-2">
                                {entry.position === 1 && <Trophy className="w-4 h-4 text-yellow-500" />}
                                {entry.position === 2 && <Trophy className="w-4 h-4 text-gray-400" />}
                                {entry.position === 3 && <Trophy className="w-4 h-4 text-amber-600" />}
                                #{entry.position}
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="text-white font-medium">
                            {entry.team_name}
                          </TableCell>
                          {supportsGrouping && (
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
