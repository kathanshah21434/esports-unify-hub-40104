import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Calendar, Users, MapPin, Trophy, ArrowLeft, Gamepad, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import Layout from '@/components/layout/Layout';
import TournamentRegistrationComponent from '@/components/tournament/TournamentRegistration';
import TournamentTimer from '@/components/tournament/TournamentTimer';
import PrizeDistribution from '@/components/tournament/PrizeDistribution';
import SponsorsSection from '@/components/tournament/SponsorsSection';
import PointsTable from '@/components/tournament/PointsTable';
import RegisteredTeams from '@/components/tournament/RegisteredTeams';
import TournamentWinners from '@/components/tournament/TournamentWinners';
import { useGameStore } from '@/store/gameStore';

const TournamentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { tournaments, initialize } = useGameStore();
  useEffect(() => {
    initialize();
  }, [initialize]);

  const tournament = tournaments.find(t => t.id === id);

  if (!tournament) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-white mb-4">Tournament not found</h1>
            <Button onClick={() => navigate('/tournaments')}>
              Back to Tournaments
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  // Compute team tournament indicators for display
  const tdComputedTeamSize = typeof tournament.team_size === 'number'
    ? tournament.team_size
    : (tournament.team_size === 'duo' ? 2 : tournament.team_size === 'squad' ? 4 : tournament.team_size === '5-man' ? 5 : undefined);
  const tdTeamMode = (tournament as any).team_mode as string | undefined;
  const tdIsTeamTournament = (tdComputedTeamSize && tdComputedTeamSize > 1) || (tdTeamMode && tdTeamMode !== 'solo');
  const tdTeamSize = tdComputedTeamSize || (tdTeamMode === 'duo' ? 2 : tdTeamMode === 'squad' ? 4 : tdTeamMode === '5-man' ? 5 : 1);
  const tdMaxTeams = tdIsTeamTournament ? Math.max(1, Math.floor((tournament.max_participants || 0) / tdTeamSize)) : 0;

  return (
    <Layout>
      <div className="min-h-screen">
        {/* Hero Section */}
        <div className="relative h-[300px] sm:h-[400px] lg:h-[500px] overflow-hidden">
          {tournament.banner ? (
            <img 
              src={tournament.banner} 
              alt={tournament.name}
              className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-700"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-purple-900/50 to-blue-900/50"></div>
          )}
          <div className="absolute inset-0 bg-black/50"></div>
          
          <div className="absolute inset-0 flex flex-col justify-between">
            <div className="p-4 sm:p-6 lg:p-8">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => navigate('/tournaments')}
                className="text-white hover:bg-white/20 transform hover:scale-105 transition-transform duration-200"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Tournaments
              </Button>
            </div>
            
            <div className="p-4 sm:p-6 lg:p-8">
              <div className="flex flex-wrap gap-2 mb-4">
                <Badge variant="secondary" className="bg-purple-500 text-white">
                  {tournament.game || 'battle-royale'}
                </Badge>
                <Badge 
                  variant="secondary" 
                  className={`${
                    tournament.status === 'upcoming' 
                      ? 'bg-blue-500 text-white animate-pulse shadow-lg shadow-blue-500/50' :
                    tournament.status === 'ongoing' 
                      ? 'bg-green-500 text-white animate-pulse shadow-lg shadow-green-500/50' :
                    tournament.status === 'completed'
                      ? 'bg-yellow-500 text-white shadow-lg shadow-yellow-500/50' :
                    tournament.status === 'full'
                      ? 'bg-red-500 text-white' :
                    'bg-gray-500 text-white'
                  }`}
                >
                  {tournament.status === 'ongoing' && '🔴 '}
                  {tournament.status.toUpperCase()}
                </Badge>
                {tournament.entry_fee && (
                  <Badge variant="secondary" className="bg-green-500 text-white">
                    Entry: {tournament.entry_fee}
                  </Badge>
                )}
              </div>
              
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-white mb-4 leading-tight">
                {tournament.name}
              </h1>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 text-white text-xs sm:text-sm">
                <div className="flex items-center">
                  <Calendar className="w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5 mr-1 sm:mr-2 flex-shrink-0" />
                  <span className="truncate">
                    {new Date(tournament.start_date).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center">
                  <Users className="w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5 mr-1 sm:mr-2 flex-shrink-0" />
                  <span className="truncate">
                    {tdIsTeamTournament
                      ? `${tournament.current_participants}/${tdMaxTeams} Teams`
                      : `${tournament.current_participants}/${tournament.max_participants} Players`}
                  </span>
                </div>
                <div className="flex items-center">
                  <MapPin className="w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5 mr-1 sm:mr-2 flex-shrink-0" />
                  <span className="truncate">{tournament.region || 'Global'}</span>
                </div>
                <div className="flex items-center">
                  <Gamepad className="w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5 mr-1 sm:mr-2 flex-shrink-0" />
                  <span className="truncate">{tournament.format || 'Battle Royale'}</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Prize Pool Card */}
          <div className="absolute top-4 right-4 lg:top-6 lg:right-6">
            <Card className="bg-black/20 border-gray-600 backdrop-blur-sm">
              <CardContent className="p-4 text-center">
                <p className="text-white text-sm mb-1">Prize Pool</p>
                <p className="text-yellow-400 text-xl lg:text-2xl font-bold">{tournament.prize_pool}</p>
              </CardContent>
            </Card>
          </div>
        </div>


        {/* Tournament Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
          <div className="grid lg:grid-cols-3 gap-6 lg:gap-8">
            <div className="lg:col-span-2">
              {/* Tournament Timer */}
              <TournamentTimer tournament={tournament} />
              
              <Tabs defaultValue={tournament.status === 'completed' ? 'winners' : 'overview'} className="w-full">
                <TabsList className="grid w-full grid-cols-4 sm:grid-cols-8 bg-gray-800 p-1 h-auto">
                  <TabsTrigger value="overview" className="transition-all duration-200 hover:scale-105 text-sm p-3">
                    <span className="hidden sm:inline">Overview</span>
                    <span className="sm:hidden">Info</span>
                  </TabsTrigger>
                  {tournament.status === 'completed' && (
                    <TabsTrigger value="winners" className="transition-all duration-200 hover:scale-105 text-sm p-3 bg-yellow-500/20">
                      <Trophy className="w-4 h-4 mr-1 inline" />
                      <span className="hidden sm:inline">Winners</span>
                      <span className="sm:hidden">🏆</span>
                    </TabsTrigger>
                  )}
                  <TabsTrigger value="register" className="transition-all duration-200 hover:scale-105 text-sm p-3">
                    <span className="hidden sm:inline">Register</span>
                    <span className="sm:hidden">Join</span>
                  </TabsTrigger>
                  {tournament.team_size && ['duo', 'squad', '5-man'].includes(tournament.team_size) && (
                    <>
                      <TabsTrigger value="teams" className="transition-all duration-200 hover:scale-105 text-sm p-3">
                        <span className="hidden sm:inline">Teams</span>
                        <span className="sm:hidden">Teams</span>
                      </TabsTrigger>
                      <TabsTrigger value="points" className="transition-all duration-200 hover:scale-105 text-sm p-3">
                        <span className="hidden sm:inline">Points</span>
                        <span className="sm:hidden">Pts</span>
                      </TabsTrigger>
                    </>
                  )}
                  <TabsTrigger value="rules" className="transition-all duration-200 hover:scale-105 text-sm p-3">Rules</TabsTrigger>
                  <TabsTrigger value="schedule" className="transition-all duration-200 hover:scale-105 text-sm p-3 hidden sm:block">Schedule</TabsTrigger>
                  <TabsTrigger value="prizes" className="transition-all duration-200 hover:scale-105 text-sm p-3 hidden sm:block">Prizes</TabsTrigger>
                </TabsList>
                
                {tournament.status === 'completed' && (
                  <TabsContent value="winners" className="mt-6">
                    <TournamentWinners tournamentId={tournament.id} />
                  </TabsContent>
                )}
                
                <TabsContent value="register" className="mt-6">
                  <TournamentRegistrationComponent tournament={tournament} />
                </TabsContent>

                {tournament.team_size && ['duo', 'squad', '5-man'].includes(tournament.team_size) && (
                  <>
                    <TabsContent value="teams" className="mt-6">
                      <RegisteredTeams tournamentId={tournament.id} teamSize={tournament.team_size} />
                    </TabsContent>
                    <TabsContent value="points" className="mt-6">
                      <PointsTable tournamentId={tournament.id} teamSize={tournament.team_size} />
                    </TabsContent>
                  </>
                )}
                
                <TabsContent value="overview" className="mt-6">
                  <div className="space-y-6">
                    {/* Hero Description */}
                    <Card className="bg-gray-800/50 border-gray-700 backdrop-blur-sm">
                      <CardContent className="p-6">
                        <div className="flex items-center mb-6">
                          <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full flex items-center justify-center mr-4 shadow-xl">
                            <Gamepad className="w-7 h-7 text-white" />
                          </div>
                          <h3 className="text-2xl font-bold text-white">About the Tournament</h3>
                        </div>
                        <p className="text-gray-300 text-lg leading-relaxed">
                          {tournament.description || 'Join the ultimate Free Fire tournament and compete against the best players from around the world! Show your skills, strategy, and teamwork to win the grand prize.'}
                        </p>
                      </CardContent>
                    </Card>

                    {/* Tournament Details Grid */}
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <Card className="bg-gray-800/50 border-gray-700 hover:border-purple-500/50 transition-all duration-300">
                        <CardContent className="p-6 text-center">
                          <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-xl">
                            <Gamepad className="w-7 h-7 text-white" />
                          </div>
                          <h4 className="text-white font-bold mb-2 text-base uppercase tracking-wide">Format</h4>
                          <p className="text-purple-400 font-bold text-xl">{tournament.format || 'Battle Royale'}</p>
                        </CardContent>
                      </Card>
                      
                      <Card className="bg-gray-800/50 border-gray-700 hover:border-green-500/50 transition-all duration-300">
                        <CardContent className="p-6 text-center">
                          <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-xl">
                            <Trophy className="w-7 h-7 text-white" />
                          </div>
                          <h4 className="text-white font-bold mb-2 text-base uppercase tracking-wide">Entry Fee</h4>
                          <p className="text-green-400 font-bold text-xl">{tournament.entry_fee || '₹10'}</p>
                        </CardContent>
                      </Card>

                      <Card className="bg-gray-800/50 border-gray-700 hover:border-orange-500/50 transition-all duration-300">
                        <CardContent className="p-6 text-center">
                          <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-red-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-xl">
                            <MapPin className="w-7 h-7 text-white" />
                          </div>
                          <h4 className="text-white font-bold mb-2 text-base uppercase tracking-wide">Region</h4>
                          <p className="text-orange-400 font-bold text-xl">{tournament.region || 'Global'}</p>
                        </CardContent>
                      </Card>

                      <Card className="bg-gray-800/50 border-gray-700 hover:border-blue-500/50 transition-all duration-300">
                        <CardContent className="p-6 text-center">
                          <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-xl">
                            <Users className="w-7 h-7 text-white" />
                          </div>
                          <h4 className="text-white font-bold mb-2 text-base uppercase tracking-wide">Organizer</h4>
                          <p className="text-blue-400 font-bold text-xl">{tournament.organizer || 'Battle Mitra'}</p>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Key Highlights */}
                    {tournament.highlights && (
                      <Card className="bg-gradient-to-br from-yellow-600/20 via-orange-600/20 to-red-600/20 border-yellow-400/30 backdrop-blur-sm">
                        <CardContent className="p-8">
                          <div className="flex items-center mb-6">
                            <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-full flex items-center justify-center mr-4">
                              <Trophy className="w-6 h-6 text-white" />
                            </div>
                            <h4 className="text-2xl font-bold text-white">Key Highlights</h4>
                          </div>
                          <div className="grid md:grid-cols-2 gap-4">
                            {tournament.highlights.map((highlight, index) => (
                              <div key={index} className="flex items-center p-4 bg-black/20 rounded-lg border-l-4 border-yellow-400">
                                <div className="w-3 h-3 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full mr-4 flex-shrink-0"></div>
                                <span className="text-gray-200 font-medium">{highlight}</span>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </TabsContent>
                
                <TabsContent value="rules" className="mt-6">
                  <Card className="bg-gradient-to-br from-red-900/30 via-orange-900/20 to-yellow-900/30 border-red-500/30 backdrop-blur-sm overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-red-600/5 to-orange-600/5" />
                    <CardContent className="relative p-8">
                      <div className="flex items-center mb-8">
                        <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-orange-600 rounded-xl flex items-center justify-center mr-6 shadow-lg">
                          <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 1.414L10.586 9H7a1 1 0 100 2h3.586l-1.293 1.293a1 1 0 101.414 1.414l3-3a1 1 0 000-1.414z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div>
                          <h3 className="text-3xl font-bold text-white mb-2">Tournament Rules</h3>
                          <p className="text-gray-300">Important guidelines for all participants</p>
                        </div>
                      </div>
                      
                      <div className="bg-black/30 rounded-xl p-8 border border-red-500/20">
                        <div className="prose prose-invert max-w-none">
                          <div className="text-gray-200 text-lg leading-relaxed whitespace-pre-line">
                            {tournament.rules || `📋 Tournament Rules

🎯 General Guidelines:
• All participants must follow fair play rules
• No cheating, hacking, or exploiting allowed
• Respect all players and organizers
• Use only approved devices and software

⏰ Match Rules:
• Be present 15 minutes before match time
• Late arrivals may result in disqualification
• Match settings will be announced beforehand
• Screenshots required for dispute resolution

🏆 Prize Distribution:
• Winners will be announced after verification
• Prize money will be distributed within 7 days
• Valid ID proof required for prize claim
• Organizers' decision is final in all disputes

📱 Communication:
• Join our official Discord/WhatsApp group
• Check announcements regularly
• Contact support for any queries

⚠️ Violations may lead to immediate disqualification.`}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="schedule" className="mt-6">
                  <Card className="bg-gradient-to-br from-indigo-900/30 via-purple-900/20 to-blue-900/30 border-indigo-500/30 backdrop-blur-sm overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/5 to-blue-600/5" />
                    <CardContent className="relative p-8">
                      <div className="flex items-center mb-8">
                        <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-xl flex items-center justify-center mr-6 shadow-lg">
                          <Clock className="w-8 h-8 text-white" />
                        </div>
                        <div>
                          <h3 className="text-3xl font-bold text-white mb-2">Tournament Schedule</h3>
                          <p className="text-gray-300">Complete timeline and match schedule</p>
                        </div>
                      </div>
                      
                      <div className="bg-black/30 rounded-xl p-8 border border-indigo-500/20">
                        <div className="space-y-6">
                          {tournament.schedule ? (
                            <div className="text-gray-200 text-lg leading-relaxed whitespace-pre-line">
                              {tournament.schedule}
                            </div>
                          ) : (
                            <div className="space-y-6">
                              <div className="flex items-start space-x-4 p-4 bg-gradient-to-r from-indigo-600/20 to-blue-600/20 rounded-lg border-l-4 border-indigo-400">
                                <div className="w-3 h-3 bg-indigo-400 rounded-full mt-2 flex-shrink-0"></div>
                                <div>
                                  <h4 className="text-indigo-300 font-semibold text-lg mb-2">Registration Phase</h4>
                                  <p className="text-gray-300">Open registration for all participants</p>
                                  <span className="text-sm text-indigo-400">{new Date(tournament.start_date).toLocaleDateString()}</span>
                                </div>
                              </div>
                              
                              <div className="flex items-start space-x-4 p-4 bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded-lg border-l-4 border-purple-400">
                                <div className="w-3 h-3 bg-purple-400 rounded-full mt-2 flex-shrink-0"></div>
                                <div>
                                  <h4 className="text-purple-300 font-semibold text-lg mb-2">Qualification Rounds</h4>
                                  <p className="text-gray-300">Initial screening and team formation</p>
                                  <span className="text-sm text-purple-400">Day 1-2</span>
                                </div>
                              </div>
                              
                              <div className="flex items-start space-x-4 p-4 bg-gradient-to-r from-blue-600/20 to-cyan-600/20 rounded-lg border-l-4 border-blue-400">
                                <div className="w-3 h-3 bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
                                <div>
                                  <h4 className="text-blue-300 font-semibold text-lg mb-2">Semi-Finals</h4>
                                  <p className="text-gray-300">Top teams compete for final spots</p>
                                  <span className="text-sm text-blue-400">Day 3</span>
                                </div>
                              </div>
                              
                              <div className="flex items-start space-x-4 p-4 bg-gradient-to-r from-yellow-600/20 to-orange-600/20 rounded-lg border-l-4 border-yellow-400">
                                <div className="w-3 h-3 bg-yellow-400 rounded-full mt-2 flex-shrink-0"></div>
                                <div>
                                  <h4 className="text-yellow-300 font-semibold text-lg mb-2">Grand Finals</h4>
                                  <p className="text-gray-300">Ultimate showdown for the championship</p>
                                  <span className="text-sm text-yellow-400">{new Date(tournament.end_date).toLocaleDateString()}</span>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="prizes" className="mt-6">
                  <div className="space-y-6">
                    <PrizeDistribution prizesContent={tournament.prizes_content} />
                  </div>
                </TabsContent>
              </Tabs>

              {/* Winners Announcement for Completed Tournaments */}
              {(tournament.status === 'completed' || tournament.status === 'ongoing') && (tournament as any)?.winners && (
                <div className="mt-8">
                  {/* Celebration Banner */}
                  <div className="bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400 p-1 rounded-xl mb-6 shadow-2xl">
                    <Card className="bg-gray-900 border-0 rounded-lg overflow-hidden">
                      <CardContent className="p-0">
                        {/* Header Section */}
                        <div className="bg-gradient-to-br from-yellow-500/30 via-orange-500/30 to-red-500/30 p-8 text-center relative overflow-hidden">
                          {/* Animated background elements */}
                          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,_hsl(45,100%,70%,0.1)_0%,_transparent_50%)]" />
                          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,_hsl(25,100%,60%,0.1)_0%,_transparent_50%)]" />
                          
                          <div className="relative z-10">
                            {/* Trophy Icon */}
                            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full mb-6 shadow-xl animate-bounce">
                              <Trophy className="w-10 h-10 text-white drop-shadow-lg" />
                            </div>
                            
                            {/* Title */}
                            <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-yellow-300 via-orange-300 to-red-300 bg-clip-text text-transparent mb-4 drop-shadow-lg">
                              🏆 TOURNAMENT CHAMPIONS 🏆
                            </h2>
                            
                            {/* Subtitle */}
                            <p className="text-xl text-yellow-200 font-semibold mb-2">
                              {tournament.name}
                            </p>
                            
                            {/* Decorative line */}
                            <div className="flex justify-center mb-4">
                              <div className="w-32 h-2 bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400 rounded-full shadow-lg" />
                            </div>
                          </div>
                        </div>
                        
                        {/* Winners Content */}
                        <div className="p-8 bg-gradient-to-br from-gray-800 via-gray-900 to-black">
                          <div className="bg-gradient-to-br from-yellow-500/10 via-orange-500/10 to-red-500/10 rounded-xl p-6 border-2 border-yellow-400/40 shadow-inner">
                            <div className="text-center mb-6">
                              <h3 className="text-2xl font-bold text-yellow-300 mb-2">🥇 Winners List 🥇</h3>
                            </div>
                            
                            <div className="bg-black/50 backdrop-blur-sm rounded-lg p-6 border border-yellow-400/50 shadow-lg">
                              <div className="text-white text-xl leading-loose whitespace-pre-wrap font-semibold text-center">
                                {(tournament as any).winners}
                              </div>
                            </div>
                            
                            {/* Celebration Footer */}
                            <div className="text-center mt-8 space-y-2">
                              <p className="text-2xl font-bold text-yellow-300">
                                🎉 CONGRATULATIONS! 🎉
                              </p>
                              <p className="text-lg text-orange-200 font-medium">
                                Amazing performance by our champions!
                              </p>
                              <div className="flex justify-center space-x-4 mt-4 text-2xl">
                                <span>🏆</span>
                                <span>🥇</span>
                                <span>🎊</span>
                                <span>🔥</span>
                                <span>⭐</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}

              {/* Debug Info - Remove after testing */}
              {process.env.NODE_ENV === 'development' && (
                <div className="mt-4 p-4 bg-gray-800 rounded text-white text-sm">
                  <p>Debug Info:</p>
                  <p>Status: {tournament.status}</p>
                  <p>Winners: {(tournament as any)?.winners || 'No winners data'}</p>
                  <p>Show winners: {((tournament.status === 'completed' || tournament.status === 'ongoing') && (tournament as any)?.winners) ? 'YES' : 'NO'}</p>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6 animate-fade-in animation-delay-500">
              <Card className="bg-gradient-to-br from-blue-900/40 via-purple-900/30 to-indigo-900/40 border-blue-500/30 backdrop-blur-sm shadow-xl relative overflow-hidden hover-scale">
                <div className="absolute inset-0 bg-black/20 backdrop-blur-[1px]" />
                <CardContent className="p-6 relative z-10">
                  <h3 className="text-xl font-bold text-white mb-4 flex items-center drop-shadow-lg">
                    <div className="w-8 h-8 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mr-3 shadow-lg animate-pulse">
                      <Clock className="w-4 h-4 text-white drop-shadow-sm" />
                    </div>
                    Tournament Format
                  </h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-3 bg-black/20 rounded-lg border border-blue-500/20 hover:border-blue-500/40 transition-all duration-300">
                      <span className="text-blue-200 font-semibold text-sm">Format:</span>
                      <span className="text-white font-bold drop-shadow-sm">{tournament.format || 'Battle Royale'}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-black/20 rounded-lg border border-green-500/20 hover:border-green-500/40 transition-all duration-300">
                      <span className="text-green-200 font-semibold text-sm">Entry Fee:</span>
                      <span className="text-white font-bold drop-shadow-sm">{tournament.entry_fee || '₹10'}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-black/20 rounded-lg border border-purple-500/20 hover:border-purple-500/40 transition-all duration-300">
                      <span className="text-purple-200 font-semibold text-sm">Team Size:</span>
                      <span className="text-white font-bold drop-shadow-sm">{tournament.team_size || 'Solo'}</span>
                    </div>
                    {tournament.start_time && tournament.end_time && (
                      <div className="flex justify-between items-center p-3 bg-black/20 rounded-lg border border-orange-500/20 hover:border-orange-500/40 transition-all duration-300">
                        <span className="text-orange-200 font-semibold text-sm">Time:</span>
                        <span className="text-white font-bold drop-shadow-sm">{tournament.start_time} - {tournament.end_time}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-green-900/40 via-blue-900/30 to-teal-900/40 border-green-500/30 backdrop-blur-sm shadow-xl relative overflow-hidden hover-scale">
                <div className="absolute inset-0 bg-black/20 backdrop-blur-[1px]" />
                <CardContent className="p-6 relative z-10">
                  <h3 className="text-xl font-bold text-white mb-4 flex items-center drop-shadow-lg">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-teal-500 rounded-full flex items-center justify-center mr-3 shadow-lg animate-pulse">
                      <Clock className="w-4 h-4 text-white drop-shadow-sm" />
                    </div>
                    Timeline
                  </h3>
                  <div className="space-y-4">
                    <div className="p-4 bg-black/20 rounded-lg border-l-4 border-blue-400 transform hover:translate-x-2 transition-transform duration-200">
                      <p className="text-white font-bold text-base mb-1 drop-shadow-sm">Registration Opens</p>
                      <p className="text-blue-200 font-medium">
                        {tournament.registration_opens ? 
                          new Date(tournament.registration_opens).toLocaleDateString() : 
                          new Date(tournament.start_date).toLocaleDateString()
                        }
                      </p>
                    </div>
                    <div className="p-4 bg-black/20 rounded-lg border-l-4 border-yellow-400 transform hover:translate-x-2 transition-transform duration-200">
                      <p className="text-white font-bold text-base mb-1 drop-shadow-sm">Registration Closes</p>
                      <p className="text-yellow-200 font-medium">
                        {tournament.registration_closes ? 
                          new Date(tournament.registration_closes).toLocaleDateString() : 
                          new Date(tournament.start_date).toLocaleDateString()
                        }
                      </p>
                    </div>
                    <div className="p-4 bg-black/20 rounded-lg border-l-4 border-green-400 transform hover:translate-x-2 transition-transform duration-200">
                      <p className="text-white font-bold text-base mb-1 drop-shadow-sm">Tournament Starts</p>
                      <p className="text-green-200 font-medium">
                        {new Date(tournament.start_date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Sponsors Section */}
        <SponsorsSection className="bg-gray-900/50" />
      </div>
    </Layout>
  );
};

export default TournamentDetail;