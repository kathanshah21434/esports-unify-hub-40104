import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Trophy, Plus, Trash2, Save } from 'lucide-react';

interface Winner {
  id?: string;
  tournament_id: string;
  player_name: string;
  position: number;
  prize_amount: string;
  user_id: string;
}

interface WinnersAdminProps {
  tournaments: any[];
}

const WinnersAdmin = ({ tournaments }: WinnersAdminProps) => {
  const { toast } = useToast();
  const [selectedTournamentId, setSelectedTournamentId] = useState<string>('');
  const [winners, setWinners] = useState<Winner[]>([]);
  const [registeredPlayers, setRegisteredPlayers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch registered players when tournament is selected
  useEffect(() => {
    if (selectedTournamentId) {
      fetchRegisteredPlayers();
      fetchWinners();
    }
  }, [selectedTournamentId]);

  const fetchRegisteredPlayers = async () => {
    try {
      const { data, error } = await supabase
        .from('tournament_registrations')
        .select('user_id, player_name')
        .eq('tournament_id', selectedTournamentId);

      if (error) throw error;
      setRegisteredPlayers(data || []);
    } catch (error) {
      console.error('Error fetching registered players:', error);
    }
  };

  const fetchWinners = async () => {
    try {
      const { data, error } = await supabase
        .from('tournament_winners')
        .select('*')
        .eq('tournament_id', selectedTournamentId)
        .order('position', { ascending: true });

      if (error) throw error;
      setWinners(data || []);
    } catch (error) {
      console.error('Error fetching winners:', error);
    }
  };

  const addWinnerRow = () => {
    const nextPosition = winners.length > 0 ? Math.max(...winners.map(w => w.position)) + 1 : 1;
    setWinners([...winners, {
      tournament_id: selectedTournamentId,
      player_name: '',
      position: nextPosition,
      prize_amount: '',
      user_id: '',
    }]);
  };

  const updateWinner = (index: number, field: keyof Winner, value: any) => {
    const updated = [...winners];
    updated[index] = { ...updated[index], [field]: value };

    // If player_name is selected from dropdown, also update user_id
    if (field === 'player_name') {
      const player = registeredPlayers.find(p => p.player_name === value);
      if (player) {
        updated[index].user_id = player.user_id;
      }
    }

    setWinners(updated);
  };

  const removeWinner = (index: number) => {
    setWinners(winners.filter((_, i) => i !== index));
  };

  const saveWinners = async () => {
    if (!selectedTournamentId) {
      toast({
        title: "Error",
        description: "Please select a tournament first",
        variant: "destructive",
      });
      return;
    }

    // Validate all winners have required fields
    const invalidWinners = winners.filter(w => !w.player_name || !w.position || !w.user_id);
    if (invalidWinners.length > 0) {
      toast({
        title: "Validation Error",
        description: "All winners must have a player name and position selected",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Delete existing winners for this tournament
      const { error: deleteError } = await supabase
        .from('tournament_winners')
        .delete()
        .eq('tournament_id', selectedTournamentId);

      if (deleteError) throw deleteError;

      // Insert new winners
      const { error: insertError } = await supabase
        .from('tournament_winners')
        .insert(winners.map(w => ({
          tournament_id: w.tournament_id,
          player_name: w.player_name,
          position: w.position,
          prize_amount: w.prize_amount || null,
          user_id: w.user_id,
        })));

      if (insertError) throw insertError;

      toast({
        title: "Success",
        description: "Winners announced successfully!",
      });

      fetchWinners();
    } catch (error: any) {
      console.error('Error saving winners:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to save winners",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-primary" />
            Announce Tournament Winners
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">Select Tournament</label>
            <Select value={selectedTournamentId} onValueChange={setSelectedTournamentId}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a tournament" />
              </SelectTrigger>
              <SelectContent>
                {tournaments
                  .filter(t => t.status === 'completed' || t.status === 'ongoing')
                  .map(tournament => (
                    <SelectItem key={tournament.id} value={tournament.id}>
                      {tournament.name} ({tournament.game})
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          {selectedTournamentId && (
            <>
              <div className="space-y-4">
                {winners.map((winner, index) => (
                  <div key={index} className="flex gap-3 items-end p-4 bg-muted/50 rounded-lg">
                    <div className="flex-1">
                      <label className="block text-xs font-medium mb-1">Position</label>
                      <Input
                        type="number"
                        min="1"
                        value={winner.position}
                        onChange={(e) => updateWinner(index, 'position', parseInt(e.target.value))}
                      />
                    </div>

                    <div className="flex-[2]">
                      <label className="block text-xs font-medium mb-1">Player Name</label>
                      <Select
                        value={winner.player_name}
                        onValueChange={(value) => updateWinner(index, 'player_name', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select player" />
                        </SelectTrigger>
                        <SelectContent>
                          {registeredPlayers.map((player, idx) => (
                            <SelectItem key={idx} value={player.player_name}>
                              {player.player_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex-1">
                      <label className="block text-xs font-medium mb-1">Prize Amount</label>
                      <Input
                        type="text"
                        placeholder="e.g., ₹5000"
                        value={winner.prize_amount}
                        onChange={(e) => updateWinner(index, 'prize_amount', e.target.value)}
                      />
                    </div>

                    <Button
                      variant="destructive"
                      size="icon"
                      onClick={() => removeWinner(index)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={addWinnerRow}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add Winner
                </Button>

                <Button
                  onClick={saveWinners}
                  disabled={loading || winners.length === 0}
                  className="flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  {loading ? 'Saving...' : 'Save Winners'}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default WinnersAdmin;
