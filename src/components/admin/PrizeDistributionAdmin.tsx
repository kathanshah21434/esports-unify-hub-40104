import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Edit, Trash2, Save, X, Trophy, Star, Award } from 'lucide-react';
import { useGameStore } from '@/store/gameStore';
import { PrizesContent } from '@/types';
import { useToast } from '@/hooks/use-toast';

interface PrizeDistributionAdminProps {
  tournamentId?: string;
}

const PrizeDistributionAdmin = ({ tournamentId }: PrizeDistributionAdminProps) => {
  const { tournaments, updateTournament } = useGameStore();
  const { toast } = useToast();
  
  const [selectedTournamentId, setSelectedTournamentId] = useState(tournamentId || '');
  const [editingPrize, setEditingPrize] = useState<number | null>(null);
  const [showAddPrize, setShowAddPrize] = useState(false);
  const [showAddReward, setShowAddReward] = useState(false);
  const [editingReward, setEditingReward] = useState<number | null>(null);

  const [prizeForm, setPrizeForm] = useState({
    position: '',
    title: '',
    amount: '',
    description: '',
  });

  const [rewardForm, setRewardForm] = useState({
    title: '',
    description: '',
  });

  const selectedTournament = tournaments.find(t => t.id === selectedTournamentId);
  const currentPrizes = (selectedTournament?.prizes_content as PrizesContent) || { positions: [], additional_rewards: [] };

  // Initialize empty prizes_content if it doesn't exist
  useEffect(() => {
    if (selectedTournament && !selectedTournament.prizes_content) {
      updateTournament(selectedTournamentId, {
        prizes_content: { positions: [], additional_rewards: [] } as any
      }).catch(err => {
        console.error('Failed to initialize prizes_content:', err);
      });
    }
  }, [selectedTournament?.id]);

  const getPositionColor = (position: number) => {
    switch (position) {
      case 1: return "from-yellow-400 to-yellow-600";
      case 2: return "from-gray-300 to-gray-500";
      case 3: return "from-orange-400 to-orange-600";
      default: return "from-purple-400 to-purple-600";
    }
  };

  const resetPrizeForm = () => {
    setPrizeForm({
      position: '',
      title: '',
      amount: '',
      description: '',
    });
    setEditingPrize(null);
    setShowAddPrize(false);
  };

  const resetRewardForm = () => {
    setRewardForm({
      title: '',
      description: '',
    });
    setEditingReward(null);
    setShowAddReward(false);
  };

  const handleSavePrize = async () => {
    try {
      if (!selectedTournamentId) {
        toast({
          title: "Error",
          description: "Please select a tournament first.",
          variant: "destructive",
        });
        return;
      }

      if (!prizeForm.position || !prizeForm.title || !prizeForm.amount) {
        toast({
          title: "Validation Error",
          description: "Position, title, and amount are required.",
          variant: "destructive",
        });
        return;
      }

      const newPrize = {
        position: parseInt(prizeForm.position),
        title: prizeForm.title,
        amount: prizeForm.amount,
        description: prizeForm.description,
        color: getPositionColor(parseInt(prizeForm.position)),
      };

      let updatedPositions = [...(currentPrizes.positions || [])];

      if (editingPrize !== null) {
        updatedPositions[editingPrize] = newPrize;
      } else {
        updatedPositions.push(newPrize);
      }

      // Sort by position
      updatedPositions.sort((a, b) => a.position - b.position);

      const updatedPrizesContent: PrizesContent = {
        ...currentPrizes,
        positions: updatedPositions,
      };

      await updateTournament(selectedTournamentId, {
        prizes_content: updatedPrizesContent,
      });

      toast({
        title: "Prize Updated",
        description: "Prize information has been updated successfully.",
      });

      resetPrizeForm();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update prize. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleSaveReward = async () => {
    try {
      if (!selectedTournamentId) {
        toast({
          title: "Error",
          description: "Please select a tournament first.",
          variant: "destructive",
        });
        return;
      }

      if (!rewardForm.title || !rewardForm.description) {
        toast({
          title: "Validation Error",
          description: "Title and description are required.",
          variant: "destructive",
        });
        return;
      }

      const newReward = {
        title: rewardForm.title,
        description: rewardForm.description,
      };

      let updatedRewards = [...(currentPrizes.additional_rewards || [])];

      if (editingReward !== null) {
        updatedRewards[editingReward] = newReward;
      } else {
        updatedRewards.push(newReward);
      }

      const updatedPrizesContent: PrizesContent = {
        ...currentPrizes,
        additional_rewards: updatedRewards,
      };

      await updateTournament(selectedTournamentId, {
        prizes_content: updatedPrizesContent,
      });

      toast({
        title: "Reward Updated",
        description: "Additional reward has been updated successfully.",
      });

      resetRewardForm();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update reward. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleEditPrize = (index: number) => {
    const prize = currentPrizes.positions[index];
    setPrizeForm({
      position: prize.position.toString(),
      title: prize.title,
      amount: prize.amount,
      description: prize.description || '',
    });
    setEditingPrize(index);
    setShowAddPrize(true);
  };

  const handleEditReward = (index: number) => {
    const reward = currentPrizes.additional_rewards[index];
    setRewardForm({
      title: reward.title,
      description: reward.description,
    });
    setEditingReward(index);
    setShowAddReward(true);
  };

  const handleDeletePrize = async (index: number) => {
    try {
      if (!selectedTournamentId) return;

      const updatedPositions = currentPrizes.positions.filter((_, i) => i !== index);
      const updatedPrizesContent: PrizesContent = {
        ...currentPrizes,
        positions: updatedPositions,
      };

      await updateTournament(selectedTournamentId, {
        prizes_content: updatedPrizesContent,
      });

      toast({
        title: "Prize Deleted",
        description: "Prize has been deleted successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete prize. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteReward = async (index: number) => {
    try {
      if (!selectedTournamentId) return;

      const updatedRewards = currentPrizes.additional_rewards.filter((_, i) => i !== index);
      const updatedPrizesContent: PrizesContent = {
        ...currentPrizes,
        additional_rewards: updatedRewards,
      };

      await updateTournament(selectedTournamentId, {
        prizes_content: updatedPrizesContent,
      });

      toast({
        title: "Reward Deleted",
        description: "Additional reward has been deleted successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete reward. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">Prize Distribution Admin</h2>
      </div>

      {/* Tournament Selection */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Select Tournament</CardTitle>
        </CardHeader>
        <CardContent>
          <select
            value={selectedTournamentId || "none"}
            onChange={(e) => setSelectedTournamentId(e.target.value === "none" ? "" : e.target.value)}
            className="w-full p-2 bg-gray-700 border border-gray-600 text-white rounded"
          >
            <option value="none">Select a tournament</option>
            {tournaments.map((tournament) => (
              <option key={tournament.id} value={tournament.id}>
                {tournament.name}
              </option>
            ))}
          </select>
        </CardContent>
      </Card>

      {selectedTournamentId && (
        <>
          {/* Prize Positions */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="text-white flex items-center">
                  <Trophy className="w-5 h-5 mr-2" />
                  Prize Positions
                </CardTitle>
                <Button onClick={() => setShowAddPrize(true)} className="bg-purple-600 hover:bg-purple-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Prize
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {(showAddPrize || editingPrize !== null) && (
                <div className="mb-6 p-4 bg-gray-700 rounded">
                  <h4 className="text-white font-medium mb-3">
                    {editingPrize !== null ? 'Edit Prize' : 'Add New Prize'}
                  </h4>
                  <div className="grid md:grid-cols-2 gap-4 mb-4">
                    <Input
                      placeholder="Position (1, 2, 3...)"
                      value={prizeForm.position}
                      onChange={(e) => setPrizeForm({...prizeForm, position: e.target.value})}
                      className="bg-gray-600 border-gray-500 text-white"
                    />
                    <Input
                      placeholder="Title (e.g., 1st Place)"
                      value={prizeForm.title}
                      onChange={(e) => setPrizeForm({...prizeForm, title: e.target.value})}
                      className="bg-gray-600 border-gray-500 text-white"
                    />
                  </div>
                  <div className="grid md:grid-cols-2 gap-4 mb-4">
                    <Input
                      placeholder="Amount (e.g., ₹5000)"
                      value={prizeForm.amount}
                      onChange={(e) => setPrizeForm({...prizeForm, amount: e.target.value})}
                      className="bg-gray-600 border-gray-500 text-white"
                    />
                    <Input
                      placeholder="Description"
                      value={prizeForm.description}
                      onChange={(e) => setPrizeForm({...prizeForm, description: e.target.value})}
                      className="bg-gray-600 border-gray-500 text-white"
                    />
                  </div>
                  <div className="flex space-x-2">
                    <Button onClick={handleSavePrize} className="bg-green-600 hover:bg-green-700">
                      <Save className="w-4 h-4 mr-2" />
                      Save
                    </Button>
                    <Button onClick={resetPrizeForm} variant="outline" className="border-gray-500 text-gray-300">
                      <X className="w-4 h-4 mr-2" />
                      Cancel
                    </Button>
                  </div>
                </div>
              )}

              <div className="space-y-3">
                {currentPrizes.positions.length === 0 ? (
                  <div className="text-center text-gray-400 py-4">
                    No prizes defined yet. Add your first prize!
                  </div>
                ) : (
                  currentPrizes.positions.map((prize, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-gray-700 rounded">
                      <div className="flex items-center space-x-4">
                        <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center text-black font-bold">
                          {prize.position}
                        </div>
                        <div>
                          <div className="text-white font-medium">{prize.title}</div>
                          <div className="text-yellow-400 font-bold">{prize.amount}</div>
                          {prize.description && (
                            <div className="text-gray-400 text-sm">{prize.description}</div>
                          )}
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button size="sm" onClick={() => handleEditPrize(index)} className="bg-blue-600 hover:bg-blue-700">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => handleDeletePrize(index)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Additional Rewards */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="text-white flex items-center">
                  <Star className="w-5 h-5 mr-2" />
                  Additional Rewards
                </CardTitle>
                <Button onClick={() => setShowAddReward(true)} className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Reward
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {(showAddReward || editingReward !== null) && (
                <div className="mb-6 p-4 bg-gray-700 rounded">
                  <h4 className="text-white font-medium mb-3">
                    {editingReward !== null ? 'Edit Reward' : 'Add New Reward'}
                  </h4>
                  <div className="space-y-4">
                    <Input
                      placeholder="Reward title"
                      value={rewardForm.title}
                      onChange={(e) => setRewardForm({...rewardForm, title: e.target.value})}
                      className="bg-gray-600 border-gray-500 text-white"
                    />
                    <Textarea
                      placeholder="Reward description"
                      value={rewardForm.description}
                      onChange={(e) => setRewardForm({...rewardForm, description: e.target.value})}
                      className="bg-gray-600 border-gray-500 text-white"
                    />
                  </div>
                  <div className="flex space-x-2 mt-4">
                    <Button onClick={handleSaveReward} className="bg-green-600 hover:bg-green-700">
                      <Save className="w-4 h-4 mr-2" />
                      Save
                    </Button>
                    <Button onClick={resetRewardForm} variant="outline" className="border-gray-500 text-gray-300">
                      <X className="w-4 h-4 mr-2" />
                      Cancel
                    </Button>
                  </div>
                </div>
              )}

              <div className="space-y-3">
                {currentPrizes.additional_rewards.length === 0 ? (
                  <div className="text-center text-gray-400 py-4">
                    No additional rewards defined yet.
                  </div>
                ) : (
                  currentPrizes.additional_rewards.map((reward, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-gray-700 rounded">
                      <div className="flex items-center space-x-4">
                        <Award className="w-6 h-6 text-purple-400" />
                        <div>
                          <div className="text-white font-medium">{reward.title}</div>
                          <div className="text-gray-400 text-sm">{reward.description}</div>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button size="sm" onClick={() => handleEditReward(index)} className="bg-blue-600 hover:bg-blue-700">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => handleDeleteReward(index)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default PrizeDistributionAdmin;