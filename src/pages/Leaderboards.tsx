
import { useState, useEffect } from 'react';
import { Trophy, Medal, Award, Flag, Loader2, Search } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import Layout from '@/components/layout/Layout';
import { useGameStore } from '@/store/gameStore';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const Leaderboards = () => {
  const { players, isLoading, error, initialize } = useGameStore();
  const [selectedGame, setSelectedGame] = useState('Global');
  const [searchQuery, setSearchQuery] = useState('');
  const [gameFilter, setGameFilter] = useState('All Games');

  useEffect(() => {
    initialize();
  }, [initialize]);

  const sortedPlayers = [...players].sort((a, b) => a.rank - b.rank);

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="w-5 h-5 text-yellow-500" />;
      case 2:
        return <Medal className="w-5 h-5 text-gray-400" />;
      case 3:
        return <Award className="w-5 h-5 text-amber-600" />;
      default:
        return <span className="w-5 h-5 flex items-center justify-center text-gray-400 font-bold text-sm">{rank}</span>;
    }
  };

  const formatEarnings = (earnings: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(earnings);
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex justify-center items-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
            <span className="ml-2 text-gray-400">Loading leaderboards...</span>
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center py-12">
            <Trophy className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-red-400 mb-2">Error Loading Leaderboards</h3>
            <p className="text-gray-500">{error}</p>
            <Button onClick={() => initialize()} className="mt-4">
              Retry
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-8 md:mb-12">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-2 md:mb-4">Leaderboards</h1>
          <p className="text-gray-400 text-sm md:text-lg max-w-3xl mx-auto px-4">
            Track the top performing players across all games and tournaments. Will you make it to the top of the rankings?
          </p>
        </div>

        {/* Filter Tabs and Search */}
        <div className="mb-6 md:mb-8">
          <div className="flex flex-wrap gap-1 sm:gap-2 mb-4 md:mb-6 justify-center">
            {['Global', 'FPS', 'Battle Royale', 'MOBA', 'Sports'].map((game) => (
              <Button
                key={game}
                variant={selectedGame === game ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setSelectedGame(game)}
                className={`text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-2 ${selectedGame === game 
                  ? 'bg-gray-700 text-white' 
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
                }`}
              >
                <span className="hidden sm:inline">{game}</span>
                <span className="sm:hidden">
                  {game === 'Battle Royale' ? 'BR' : game.slice(0, 3)}
                </span>
              </Button>
            ))}
          </div>

          {/* Search and Filter Row */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-between items-stretch sm:items-center">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search players..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-gray-800 border-gray-600 text-white placeholder:text-gray-400 text-sm"
              />
            </div>
            <Select value={gameFilter} onValueChange={setGameFilter}>
              <SelectTrigger className="w-full sm:w-48 bg-gray-800 border-gray-600 text-white text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-600">
                <SelectItem value="All Games">All Games</SelectItem>
                <SelectItem value="FPS">FPS</SelectItem>
                <SelectItem value="Battle Royale">Battle Royale</SelectItem>
                <SelectItem value="MOBA">MOBA</SelectItem>
                <SelectItem value="Sports">Sports</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Global Rankings Table */}
        <Card className="bg-gray-800 border-gray-700 overflow-hidden">
          <CardHeader className="pb-3 sm:pb-4">
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400" />
              <CardTitle className="text-white text-lg sm:text-xl">Global Rankings</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-gray-700 hover:bg-transparent">
                    <TableHead className="text-gray-400 font-medium text-xs sm:text-sm px-2 sm:px-4">Rank</TableHead>
                    <TableHead className="text-gray-400 font-medium text-xs sm:text-sm px-2 sm:px-4">Player</TableHead>
                    <TableHead className="text-gray-400 font-medium text-xs sm:text-sm px-2 sm:px-4 hidden sm:table-cell">Win Rate</TableHead>
                    <TableHead className="text-gray-400 font-medium text-xs sm:text-sm px-2 sm:px-4 hidden md:table-cell">Tournaments</TableHead>
                    <TableHead className="text-gray-400 font-medium text-xs sm:text-sm px-2 sm:px-4 text-right">Earnings</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedPlayers.map((player, index) => (
                    <TableRow 
                      key={player.id} 
                      className={`border-gray-700 hover:bg-gray-700/50 transition-colors ${
                        index < 3 ? 'bg-gray-700/30' : ''
                      }`}
                    >
                      <TableCell className="py-3 sm:py-4 px-2 sm:px-4">
                        <div className="flex items-center gap-1 sm:gap-2">
                          {getRankIcon(player.rank)}
                        </div>
                      </TableCell>
                      <TableCell className="py-3 sm:py-4 px-2 sm:px-4">
                        <div className="flex items-center gap-2 sm:gap-3">
                          <Avatar className="w-8 h-8 sm:w-10 sm:h-10">
                            <AvatarImage src={player.avatar} alt={player.name} />
                            <AvatarFallback>{player.name.slice(0, 2)}</AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <div className="text-white font-semibold text-sm sm:text-base truncate">{player.name}</div>
                            <div className="text-gray-400 text-xs sm:text-sm">
                              {player.team && (
                                <span className="hidden sm:inline">{player.team} • </span>
                              )}
                              <Flag className="inline w-3 h-3 mr-1" />
                              <span className="hidden sm:inline">{player.country}</span>
                              <span className="sm:hidden">{player.country.slice(0, 2)}</span>
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="py-3 sm:py-4 px-2 sm:px-4 hidden sm:table-cell">
                        <div className="flex items-center gap-2 sm:gap-3">
                          <div className="flex-1">
                            <Progress 
                              value={player.win_rate} 
                              className="h-1.5 sm:h-2 bg-gray-700"
                            />
                          </div>
                          <span className="text-white font-medium min-w-[2.5rem] sm:min-w-[3rem] text-xs sm:text-sm">
                            {player.win_rate.toFixed(0)}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="py-3 sm:py-4 px-2 sm:px-4 hidden md:table-cell">
                        <div className="text-purple-400 font-semibold text-xs sm:text-sm">
                          {player.tournaments_won} wins
                        </div>
                      </TableCell>
                      <TableCell className="py-3 sm:py-4 px-2 sm:px-4 text-right">
                        <div className="text-green-400 font-bold text-xs sm:text-sm">
                          {formatEarnings(player.earnings)}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {sortedPlayers.length === 0 && (
          <div className="text-center py-12">
            <Trophy className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-400 mb-2">No players found</h3>
            <p className="text-gray-500">Check back later for updated rankings</p>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Leaderboards;
