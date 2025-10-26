import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { tournamentRegistrationService, TournamentRegistration, TournamentRoom } from '@/services/tournamentRegistrationService';
import { walletService, WalletBalance } from '@/services/walletService';
import { supabase } from '@/integrations/supabase/client';
import { Tournament, TournamentTeam } from '@/types';
import { Users, Lock, Key, CreditCard, CheckCircle, Clock, Crown, UserPlus, Wallet } from 'lucide-react';
import GameIdInputDialog from './GameIdInputDialog';
import TeamRegistrationDialog from './TeamRegistrationDialog';
import TournamentTimer from './TournamentTimer';
import TeamCard from './TeamCard';

interface TournamentRegistrationProps {
  tournament: Tournament;
}

const TournamentRegistrationComponent: React.FC<TournamentRegistrationProps> = ({ tournament }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [userRegistration, setUserRegistration] = useState<TournamentRegistration | null>(null);
  const [registrations, setRegistrations] = useState<TournamentRegistration[]>([]);
  const [roomDetails, setRoomDetails] = useState<TournamentRoom | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [walletBalance, setWalletBalance] = useState<WalletBalance | null>(null);
  const [showGameIdDialog, setShowGameIdDialog] = useState(false);
  const [showTeamDialog, setShowTeamDialog] = useState(false);
  const [teams, setTeams] = useState<TournamentTeam[]>([]);
  const [gameId, setGameId] = useState('');
  const [showPaymentOptions, setShowPaymentOptions] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
  const { user } = useAuth();
  const { toast } = useToast();

  const isFree = !tournament.entry_fee || tournament.entry_fee === 'Free' || tournament.entry_fee === '0';
  
  // Helper function to parse team size from string
  const parseTeamSize = (size: string | number | undefined): number | undefined => {
    if (typeof size === 'number') return size;
    if (!size) return undefined;
    
    const sizeStr = size.toString().toLowerCase();
    if (sizeStr.includes('duo')) return 2;
    if (sizeStr.includes('squad')) return 4;
    if (sizeStr.includes('5') || sizeStr.includes('five') || sizeStr.includes('5-man')) return 5;
    return undefined;
  };
  
  // Determine if this is a team tournament using either team_mode (string) or team_size (number)
  const computedTeamSize = parseTeamSize(tournament.team_size);
  const teamMode = (tournament as any).team_mode as string | undefined;
  const parsedTeamMode = parseTeamSize(teamMode);
  const isTeamTournament = (computedTeamSize && computedTeamSize > 1) || (parsedTeamMode && parsedTeamMode > 1);
  const teamSize = computedTeamSize || parsedTeamMode || 1;
  const maxTeams = isTeamTournament ? Math.max(1, Math.floor((tournament.max_participants || 0) / teamSize)) : 0;
  
  // Debug logs
  console.log('Tournament Detection Debug:', {
    tournament_name: tournament.name,
    team_size_raw: tournament.team_size,
    team_mode_raw: teamMode,
    computedTeamSize,
    parsedTeamMode,
    isTeamTournament,
    finalTeamSize: teamSize,
    isFree,
    entry_fee: tournament.entry_fee
  });

  useEffect(() => {
    if (user) {
      loadUserData();
      loadRegistrations();
      if (isTeamTournament) {
        loadTeams();
      }
    }
  }, [user, tournament.id]);

  const loadTeams = async () => {
    try {
      const tournamentTeams = await tournamentRegistrationService.getTournamentTeams(tournament.id);
      setTeams(tournamentTeams);
    } catch (error) {
      console.error('Error loading teams:', error);
    }
  };

  const loadUserData = async () => {
    if (!user) return;

    try {
      // Load user profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      setUserProfile(profile);

      // Load wallet balance
      const balance = await walletService.getUserBalance(user.id);
      setWalletBalance(balance);

      // Check if user is already registered
      const registration = await tournamentRegistrationService.checkUserRegistration(user.id, tournament.id);
      setUserRegistration(registration);

      // If registered and payment completed, load room details
      if (registration && registration.payment_status === 'completed') {
        const room = await tournamentRegistrationService.getTournamentRoom(tournament.id);
        setRoomDetails(room);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const loadRegistrations = async () => {
    try {
      const regs = await tournamentRegistrationService.getTournamentRegistrations(tournament.id);
      setRegistrations(regs);
    } catch (error) {
      console.error('Error loading registrations:', error);
    }
  };

  const updateTournamentParticipantCount = async (tournamentId: string) => {
    try {
      let currentCount = 0;

      if (isTeamTournament) {
        // Count teams instead of individual registrations for team tournaments
        const { count } = await supabase
          .from('tournament_teams')
          .select('id', { count: 'exact', head: true })
          .eq('tournament_id', tournamentId);
        currentCount = count || 0;
      } else {
        // Count individual registrations for solo tournaments
        const registrations = await tournamentRegistrationService.getTournamentRegistrations(tournamentId);
        currentCount = registrations.length;
      }
      
      // Update tournament participant count
      const { error } = await supabase
        .from('tournaments')
        .update({ current_participants: currentCount })
        .eq('id', tournamentId);
      
      if (error) throw error;
      
      // Close registration when full
      const maxCapacity = isTeamTournament ? maxTeams : (tournament.max_participants || 0);
      if (currentCount >= maxCapacity) {
        const { error: statusError } = await supabase
          .from('tournaments')
          .update({ status: 'full' })
          .eq('id', tournamentId);
        
        if (!statusError) {
          toast({
            title: 'Tournament Full!',
            description: 'Registration has been closed as the tournament is now full.',
          });
        }
      }
    } catch (error) {
      console.error('Error updating participant count:', error);
    }
  };

  const handleRegister = async () => {
    if (!user || !userProfile) {
      toast({
        title: "Profile Required",
        description: "Please complete your profile first.",
        variant: "destructive"
      });
      return;
    }

    // Show game ID input dialog
    setShowGameIdDialog(true);
  };

  const handleGameIdSubmit = async (gameId: string) => {
    setGameId(gameId);
    setShowGameIdDialog(false);

    if (isTeamTournament) {
      // For team tournaments, check if paid and show payment options
      if (!isFree) {
        setShowPaymentOptions(true);
      } else {
        // Free team tournament - go directly to team dialog
        setShowTeamDialog(true);
      }
    } else {
      // Handle individual registration for solo tournaments
      await handleIndividualRegistration(gameId);
    }
  };

  const handleIndividualRegistration = async (gameId: string) => {
    if (!isFree) {
      setShowPaymentOptions(true);
      return;
    }

    setIsLoading(true);
    try {
      const registrationData = {
        tournament_id: tournament.id,
        player_name: userProfile.name || user.email || 'Unknown Player',
        player_game_id: gameId,
        payment_amount: 0
      };

      const registration = await tournamentRegistrationService.registerForTournament(registrationData);
      setUserRegistration(registration);
      
      // Update tournament participant count
      await updateTournamentParticipantCount(tournament.id);
      
      toast({
        title: "Registration Successful!",
        description: "You've been registered for the tournament.",
      });
      loadRegistrations();
      loadUserData();

    } catch (error: any) {
      toast({
        title: "Registration Failed",
        description: error.message || "Failed to register for tournament",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleWalletPayment = async () => {
    setIsLoading(true);
    try {
      const entryAmount = parseInt(tournament.entry_fee?.replace(/[^0-9]/g, '') || '0');
      
      // Check wallet balance first
      if (!walletBalance || walletBalance.available_balance < entryAmount) {
        toast({
          title: "Insufficient Balance",
          description: `You need ₹${entryAmount} in your wallet. Your current balance is ₹${walletBalance?.available_balance || 0}`,
          variant: "destructive"
        });
        setIsLoading(false);
        return;
      }
      
      // If this is a team tournament, close payment dialog and show team dialog
      if (isTeamTournament) {
        setShowPaymentOptions(false);
        setShowTeamDialog(true);
        setIsLoading(false);
        return;
      }
      
      // For solo tournaments, process payment and register
      await walletService.payForTournament(user.id, entryAmount, tournament.id, tournament.name);
      
      // Register for tournament with completed payment
      const registrationData = {
        tournament_id: tournament.id,
        player_name: userProfile.name || user.email || 'Unknown Player',
        player_game_id: gameId,
        payment_amount: entryAmount
      };

      const registration = await tournamentRegistrationService.registerForTournament(registrationData);
      
      // Registration already has payment_status and payment_amount from service
      setUserRegistration(registration);
      setShowPaymentOptions(false);
      
      // Update tournament participant count
      await updateTournamentParticipantCount(tournament.id);
      
      toast({
        title: "Registration Successful!",
        description: `Paid ₹${entryAmount} from wallet. You're now registered!`,
      });
      
      loadRegistrations();
      loadUserData();

    } catch (error: any) {
      toast({
        title: "Payment Failed",
        description: error.message || "Failed to process wallet payment",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTeamRegistrationComplete = async () => {
    // Wait for database triggers to complete
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Update tournament participant count (count teams for team tournaments)
    await updateTournamentParticipantCount(tournament.id);
    
    // Reload all data
    loadRegistrations();
    loadUserData();
    if (isTeamTournament) {
      loadTeams();
      setRefreshTrigger(prev => prev + 1);
    }
  };

  const getRegistrationStatus = () => {
    if (!userRegistration) return null;
    
    switch (userRegistration.payment_status) {
      case 'completed':
        return <Badge variant="default" className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" />Registered</Badge>;
      case 'pending':
        return <Badge variant="outline"><Clock className="w-3 h-3 mr-1" />Payment Pending</Badge>;
      case 'failed':
        return <Badge variant="destructive">Payment Failed</Badge>;
      default:
        return null;
    }
  };

  if (!user) {
    return (
      <Card className="bg-gray-800 border-gray-700">
        <CardContent className="p-6 text-center">
          <p className="text-gray-300">Please log in to register for this tournament.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Tournament Timer */}
      {tournament.timer_duration && tournament.timer_duration > 0 && (
        <TournamentTimer
          tournament={tournament}
        />
      )}

      {/* Registration Status Card */}
      <Card className="bg-gradient-to-br from-purple-900/40 via-blue-900/30 to-indigo-900/40 border-purple-500/30 backdrop-blur-sm shadow-xl relative overflow-hidden">
        <div className="absolute inset-0 bg-black/20 backdrop-blur-[1px]" />
        <CardHeader className="relative z-10">
          <CardTitle className="flex items-center gap-3 text-white text-xl drop-shadow-lg">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full flex items-center justify-center shadow-lg">
              <Users className="w-5 h-5 text-white drop-shadow-sm" />
            </div>
            Tournament Registration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 md:space-y-4 relative z-10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 md:p-4 bg-black/20 rounded-lg border border-purple-500/20 gap-2 sm:gap-0">
            <div className="space-y-1">
              <p className="font-bold text-white text-base md:text-lg drop-shadow-sm">Entry Fee: {tournament.entry_fee || 'Free'}</p>
              {isTeamTournament ? (
                <div className="space-y-1">
                  <p className="text-xs md:text-sm text-purple-200 font-medium">
                    {teams.length} / {maxTeams} teams
                  </p>
                </div>
              ) : (
                <p className="text-xs md:text-sm text-purple-200 font-medium">
                  {registrations.length} / {tournament.max_participants} participants
                </p>
              )}
            </div>
            {getRegistrationStatus()}
          </div>

          {!userRegistration ? (
            <Button 
              onClick={handleRegister} 
              disabled={isLoading || tournament.status === 'full' || registrations.length >= tournament.max_participants || (isTeamTournament && teams.length >= maxTeams)}
              className="w-full bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700 text-white font-bold py-2 md:py-3 text-sm md:text-lg shadow-xl"
            >
              {isLoading ? 'Registering...' : 
               tournament.status === 'full' || registrations.length >= tournament.max_participants || (isTeamTournament && teams.length >= maxTeams) ? 'Tournament Full' :
               isFree ? (isTeamTournament ? 'Create/Join Team' : 'Register Now') : `${isTeamTournament ? 'Create/Join Team' : 'Register'} & Pay ${tournament.entry_fee}`}
              {!isFree && <CreditCard className="w-4 md:w-5 h-4 md:h-5 ml-1 md:ml-2 drop-shadow-sm" />}
            </Button>
          ) : userRegistration.payment_status === 'pending' ? (
            <Button variant="outline" className="w-full border-yellow-400/50 text-yellow-200 bg-yellow-500/10 hover:bg-yellow-500/20 font-bold py-2 md:py-3 text-sm md:text-base">
              <Clock className="w-3 md:w-4 h-3 md:h-4 mr-1 md:mr-2" />
              Payment Pending
            </Button>
          ) : null}
        </CardContent>
      </Card>

      {/* Room Details Card - Only show if registered and payment completed */}
      {userRegistration?.payment_status === 'completed' && roomDetails && (roomDetails.room_id || roomDetails.room_password) && (
        <Card className="bg-gradient-to-br from-green-900/40 via-emerald-900/30 to-teal-900/40 border-green-500/30 backdrop-blur-sm shadow-xl relative overflow-hidden">
          <div className="absolute inset-0 bg-black/20 backdrop-blur-[1px]" />
          <CardHeader className="relative z-10">
            <CardTitle className="flex items-center gap-3 text-white text-xl drop-shadow-lg">
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center shadow-lg">
                <Lock className="w-5 h-5 text-white drop-shadow-sm" />
              </div>
              Room Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 relative z-10">
            {roomDetails.room_id && (
              <div className="p-4 bg-black/20 rounded-lg border border-green-500/20">
                <p className="text-sm font-bold text-green-200 mb-2">Room ID</p>
                <p className="font-mono text-xl text-white font-bold drop-shadow-sm">{roomDetails.room_id}</p>
              </div>
            )}
            {roomDetails.room_password && (
              <div className="p-4 bg-black/20 rounded-lg border border-emerald-500/20">
                <p className="text-sm font-bold text-emerald-200 mb-2">Password</p>
                <p className="font-mono text-xl text-white font-bold drop-shadow-sm">{roomDetails.room_password}</p>
              </div>
            )}
            <div className="p-3 bg-yellow-500/10 border border-yellow-400/30 rounded-lg">
              <p className="text-sm text-yellow-200 font-medium drop-shadow-sm">
                ⚠️ Keep these details safe. You'll need them to join the tournament room.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Teams Display for Team Tournaments */}
      {isTeamTournament && teams.length > 0 && (
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Users className="w-5 h-5" />
              Registered Teams ({teams.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {teams.map((team, index) => (
                <TeamCard 
                  key={`${team.id}-${refreshTrigger}`} 
                  team={team} 
                  index={index} 
                  teamSize={teamSize}
                  refreshTrigger={refreshTrigger}
                  currentUserId={user?.id}
                  onTeamDeleted={() => {
                    loadTeams();
                    loadRegistrations();
                    setRefreshTrigger(prev => prev + 1);
                  }}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}
      {/* Registered Players Card for Individual Tournaments */}
      {!isTeamTournament && registrations.length > 0 && (
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Users className="w-5 h-5" />
              Registered Players ({registrations.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {registrations.map((reg, index) => (
                <div key={reg.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-700/50">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-gray-400">#{index + 1}</span>
                    <div>
                      <p className="font-medium text-white">{reg.player_name}</p>
                      <p className="text-sm text-gray-400">Game ID: {reg.player_game_id}</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="bg-green-500/20 text-green-400 border-green-500/30">
                    Confirmed
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Game ID Input Dialog */}
      <GameIdInputDialog
        open={showGameIdDialog}
        onOpenChange={setShowGameIdDialog}
        onSubmit={handleGameIdSubmit}
        isLoading={isLoading}
      />

      {/* Payment Options Dialog */}
      <Dialog open={showPaymentOptions} onOpenChange={setShowPaymentOptions}>
        <DialogContent className="sm:max-w-md bg-gray-800 border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Choose Payment Method
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-gray-700/50 border border-gray-600">
              <p className="text-white font-medium mb-2">Tournament Entry Fee</p>
              <p className="text-2xl font-bold text-purple-400">{tournament.entry_fee}</p>
            </div>
            
            {/* Wallet Balance Display */}
            <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/30">
              <div className="flex items-center justify-between mb-2">
                <p className="text-blue-200 font-medium flex items-center gap-2">
                  <Wallet className="w-4 h-4" />
                  Your Wallet Balance
                </p>
                <p className="text-xl font-bold text-blue-300">
                  ₹{walletBalance?.available_balance || 0}
                </p>
              </div>
              {walletBalance && walletBalance.available_balance >= parseInt(tournament.entry_fee?.replace(/[^0-9]/g, '') || '0') ? (
                <p className="text-green-400 text-sm">✓ Sufficient balance available</p>
              ) : (
                <p className="text-red-400 text-sm">⚠️ Insufficient balance</p>
              )}
            </div>

            <div className="space-y-3">
              <Button
                onClick={handleWalletPayment}
                disabled={isLoading || !walletBalance || walletBalance.available_balance < parseInt(tournament.entry_fee?.replace(/[^0-9]/g, '') || '0')}
                className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-bold"
              >
                <Wallet className="w-4 h-4 mr-2" />
                {isLoading ? 'Processing...' : 'Pay with Wallet'}
              </Button>
              
              <Button
                variant="outline"
                onClick={() => setShowPaymentOptions(false)}
                className="w-full border-gray-600 text-gray-300 hover:bg-gray-700"
              >
                Cancel
              </Button>
            </div>
            
            {(!walletBalance || walletBalance.available_balance < parseInt(tournament.entry_fee?.replace(/[^0-9]/g, '') || '0')) && (
              <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-400/30">
                <p className="text-yellow-200 text-sm">
                  💡 Add money to your wallet to pay for tournaments instantly!
                </p>
                <Button
                  variant="link"
                  className="p-0 h-auto text-yellow-400 hover:text-yellow-300"
                  onClick={() => window.location.href = '/wallet'}
                >
                  Go to Wallet →
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Team Registration Dialog */}
      {isTeamTournament && (
        <TeamRegistrationDialog
          open={showTeamDialog}
          onOpenChange={setShowTeamDialog}
          tournament={tournament}
          onTeamCreated={handleTeamRegistrationComplete}
          gameId={gameId}
          playerName={userProfile?.name || user?.email || 'Unknown Player'}
          userId={user?.id || ''}
          walletBalance={walletBalance}
        />
      )}
    </div>
  );
};

export default TournamentRegistrationComponent;