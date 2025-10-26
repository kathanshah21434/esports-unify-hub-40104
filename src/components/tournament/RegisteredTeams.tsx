import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Crown, UserCheck, Gamepad2 } from 'lucide-react';
import { tournamentRegistrationService, TournamentRegistration } from '@/services/tournamentRegistrationService';
import { supabase } from '@/integrations/supabase/client';

interface RegisteredTeamsProps {
  tournamentId: string;
  teamSize?: string | number;
}

interface TeamWithMembers {
  id: string;
  team_name: string;
  current_members: number;
  max_members: number;
  created_at: string;
  members: TournamentRegistration[];
}

const RegisteredTeams: React.FC<RegisteredTeamsProps> = ({ tournamentId, teamSize }) => {
  const [teams, setTeams] = useState<TeamWithMembers[]>([]);
  const [loading, setLoading] = useState(true);

  // Helper function to parse team size from string
  const parseTeamSize = (size: string | number | undefined): number => {
    if (typeof size === 'number') return size;
    if (!size) return 1;
    
    const sizeStr = size.toString().toLowerCase();
    if (sizeStr.includes('duo')) return 2;
    if (sizeStr.includes('squad')) return 4;
    if (sizeStr.includes('5') || sizeStr.includes('five')) return 5;
    return 1;
  };
  
  const computedSize = parseTeamSize(teamSize);
  const isTeamTournament = computedSize > 1;

  useEffect(() => {
    if (isTeamTournament) {
      loadRegisteredTeams();
    }
    
    // Set up real-time subscription for team changes
    const channel = supabase
      .channel('tournament-teams-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tournament_teams',
          filter: `tournament_id=eq.${tournamentId}`
        },
        () => {
          // Reload teams when any team changes
          loadRegisteredTeams();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tournament_team_members'
        },
        () => {
          // Reload teams when members change
          loadRegisteredTeams();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tournamentId, isTeamTournament]);

  const loadRegisteredTeams = async () => {
    try {
      // Get all teams for this tournament
      const tournamentTeams = await tournamentRegistrationService.getTournamentTeams(tournamentId);
      
      // Get members for each team
      const teamsWithMembers = await Promise.all(
        tournamentTeams.map(async (team) => {
          const members = await tournamentRegistrationService.getTeamMembers(team.id);
          return {
            ...team,
            members: members.filter(member => member.player_name !== 'Unknown Player')
          };
        })
      );

      // Only show teams that have actual registered members
      const validTeams = teamsWithMembers.filter(team => team.members.length > 0);
      setTeams(validTeams);
    } catch (error) {
      console.error('Error loading registered teams:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isTeamTournament) {
    return null;
  }

  if (loading) {
    return (
      <Card className="bg-gray-800/50 border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Users className="w-5 h-5" />
            Registered Teams
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-gray-400 py-8">
            Loading registered teams...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (teams.length === 0) {
    return (
      <Card className="bg-gray-800/50 border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Users className="w-5 h-5" />
            Registered Teams
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-gray-400 py-8">
            <Users className="w-12 h-12 text-gray-500 mx-auto mb-4" />
            <p>No teams registered yet.</p>
            <p className="text-sm">Be the first to register your team!</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-gray-800/50 via-gray-900/30 to-blue-900/20 border-gray-700 backdrop-blur-sm overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 to-purple-600/5" />
      <CardHeader className="relative">
        <CardTitle className="flex items-center gap-2 text-white text-2xl">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <Users className="w-6 h-6 text-white" />
          </div>
          Registered Teams
        </CardTitle>
        <p className="text-gray-300">
          {teams.length} team{teams.length !== 1 ? 's' : ''} registered • {teams.reduce((acc, team) => acc + team.members.length, 0)} total players
        </p>
      </CardHeader>
      <CardContent className="relative space-y-4">
        {teams.map((team) => (
          <Card key={team.id} className="bg-gray-800/50 border-gray-600 hover:border-blue-500/50 transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">{team.team_name}</h3>
                    <p className="text-gray-400 text-sm">
                      {team.members.length} / {team.max_members} players
                    </p>
                  </div>
                </div>
                <Badge 
                  variant="outline" 
                  className={`${
                    team.current_members >= team.max_members 
                      ? 'border-red-500 text-red-400' 
                      : 'border-green-500 text-green-400'
                  }`}
                >
                  {team.current_members >= team.max_members ? 'Full' : 'Open'}
                </Badge>
              </div>

              <div className="space-y-3">
                <h4 className="text-white font-medium flex items-center gap-2">
                  <UserCheck className="w-4 h-4" />
                  Team Members
                </h4>
                <div className="grid gap-3">
                  {team.members.map((member) => (
                    <div 
                      key={member.id} 
                      className="flex items-center justify-between p-3 bg-gray-900/50 rounded-lg border border-gray-600"
                    >
                      <div className="flex items-center gap-3">
                        {member.is_team_captain && (
                          <Crown className="w-4 h-4 text-yellow-500" />
                        )}
                        <div>
                          <p className="text-white font-medium">{member.player_name}</p>
                          <div className="flex items-center gap-2 text-sm text-gray-400">
                            <Gamepad2 className="w-3 h-3" />
                            <span>ID: {member.game_id}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {member.is_team_captain && (
                          <Badge variant="outline" className="border-yellow-500 text-yellow-400 text-xs">
                            Captain
                          </Badge>
                        )}
                        <Badge variant="outline" className="border-green-500 text-green-400 text-xs">
                          {member.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </CardContent>
    </Card>
  );
};

export default RegisteredTeams;