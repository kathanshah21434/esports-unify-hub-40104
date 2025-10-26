import { useEffect, useState } from 'react';
import { Trophy, Medal, Award, Crown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';

interface Winner {
  id: string;
  tournament_id: string;
  user_id: string;
  player_name: string;
  position: number;
  prize_amount: string | null;
  created_at: string;
}

interface TournamentWinnersProps {
  tournamentId: string;
}

const TournamentWinners = ({ tournamentId }: TournamentWinnersProps) => {
  const [winners, setWinners] = useState<Winner[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchWinners();
  }, [tournamentId]);

  const fetchWinners = async () => {
    try {
      const { data, error } = await supabase
        .from('tournament_winners')
        .select('*')
        .eq('tournament_id', tournamentId)
        .order('position', { ascending: true });

      if (error) throw error;
      setWinners(data || []);
    } catch (error) {
      console.error('Error fetching winners:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getPositionIcon = (position: number) => {
    switch (position) {
      case 1:
        return <Crown className="w-8 h-8 text-yellow-400" />;
      case 2:
        return <Medal className="w-8 h-8 text-gray-400" />;
      case 3:
        return <Award className="w-8 h-8 text-amber-600" />;
      default:
        return <Trophy className="w-6 h-6 text-purple-400" />;
    }
  };

  const getPositionColor = (position: number) => {
    switch (position) {
      case 1:
        return 'from-yellow-500 to-orange-600';
      case 2:
        return 'from-gray-400 to-gray-600';
      case 3:
        return 'from-amber-600 to-orange-700';
      default:
        return 'from-purple-500 to-blue-600';
    }
  };

  const getPositionBorder = (position: number) => {
    switch (position) {
      case 1:
        return 'border-yellow-400';
      case 2:
        return 'border-gray-400';
      case 3:
        return 'border-amber-600';
      default:
        return 'border-purple-400';
    }
  };

  if (isLoading) {
    return (
      <Card className="bg-gray-800/50 border-gray-700">
        <CardContent className="p-6">
          <div className="text-center text-gray-400">Loading winners...</div>
        </CardContent>
      </Card>
    );
  }

  if (winners.length === 0) {
    return (
      <Card className="bg-gray-800/50 border-gray-700">
        <CardContent className="p-6">
          <div className="text-center text-gray-400">
            <Trophy className="w-12 h-12 mx-auto mb-4 text-gray-600" />
            <p>Winners will be announced soon!</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border-gray-700 overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-yellow-600/20 to-purple-600/20 border-b border-gray-700">
        <CardTitle className="text-white flex items-center gap-3 text-2xl">
          <Trophy className="w-7 h-7 text-yellow-400" />
          Tournament Champions
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-4">
          {winners.map((winner) => (
            <div
              key={winner.id}
              className={`relative overflow-hidden rounded-xl border-2 ${getPositionBorder(winner.position)} bg-gradient-to-r ${getPositionColor(winner.position)}/10 p-6 transition-all duration-300 hover:scale-105 hover:shadow-2xl`}
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${getPositionColor(winner.position)} opacity-10 rounded-full -mr-16 -mt-16"></div>
              
              <div className="relative flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${getPositionColor(winner.position)} flex items-center justify-center shadow-xl`}>
                    {getPositionIcon(winner.position)}
                  </div>
                  
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <Badge 
                        variant="secondary" 
                        className={`bg-gradient-to-r ${getPositionColor(winner.position)} text-white font-bold`}
                      >
                        {winner.position === 1 ? '1st Place' : 
                         winner.position === 2 ? '2nd Place' : 
                         winner.position === 3 ? '3rd Place' : 
                         `${winner.position}th Place`}
                      </Badge>
                    </div>
                    <h3 className="text-xl font-bold text-white mb-1">
                      {winner.player_name}
                    </h3>
                    {winner.prize_amount && (
                      <p className="text-lg font-bold text-green-400">
                        Prize: {winner.prize_amount}
                      </p>
                    )}
                  </div>
                </div>
                
                <div className="hidden sm:block">
                  {winner.position <= 3 && (
                    <div className="text-right">
                      <div className="text-4xl font-bold bg-gradient-to-r ${getPositionColor(winner.position)} bg-clip-text text-transparent">
                        #{winner.position}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default TournamentWinners;
