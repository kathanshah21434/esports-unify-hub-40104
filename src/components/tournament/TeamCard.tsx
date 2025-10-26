import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Crown, Trash2, UserMinus, MoreVertical } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { TournamentTeam } from '@/types';
import { tournamentRegistrationService, TournamentRegistration } from '@/services/tournamentRegistrationService';
import { useToast } from '@/hooks/use-toast';

interface TeamCardProps {
  team: TournamentTeam;
  index: number;
  teamSize: number;
  refreshTrigger?: number;
  onTeamDeleted?: () => void;
  currentUserId?: string;
}

const TeamCard: React.FC<TeamCardProps> = ({ team, index, teamSize, refreshTrigger, onTeamDeleted, currentUserId }) => {
  const { toast } = useToast();
  const [teamMembers, setTeamMembers] = useState<TournamentRegistration[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const loadTeamMembers = async () => {
      try {
        const members = await tournamentRegistrationService.getTeamMembers(team.id);
        setTeamMembers(members);
      } catch (error) {
        console.error('Error loading team members:', error);
      } finally {
        setLoading(false);
      }
    };
    loadTeamMembers();
  }, [team.id, refreshTrigger]);

  const emptySlots = Math.max(0, teamSize - teamMembers.length);
  const isCaptain = currentUserId === team.captain_user_id;

  const handleDeleteTeam = async () => {
    setIsDeleting(true);
    try {
      await tournamentRegistrationService.deleteTeam(team.id);
      toast({
        title: "Team Deleted",
        description: "Your team has been successfully deleted.",
        variant: "default",
      });
      onTeamDeleted?.();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete team.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleRemoveMember = async (memberId: string, playerName: string) => {
    try {
      await tournamentRegistrationService.removeTeamMember(team.id, memberId);
      toast({
        title: "Player Removed",
        description: `${playerName} has been removed from the team.`,
        variant: "default",
      });
      // Refresh team members
      const members = await tournamentRegistrationService.getTeamMembers(team.id);
      setTeamMembers(members);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to remove player.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="p-4 rounded-lg bg-gray-700/50 border border-gray-600">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-600 rounded mb-2"></div>
          <div className="h-4 bg-gray-600 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  // For 5-man teams, use a special roster card layout
  if (teamSize === 5) {
    return (
      <div className="p-6 rounded-xl bg-gradient-to-br from-gray-800/90 via-gray-800/80 to-gray-900/90 border-2 border-gray-600 shadow-2xl">
        {/* Team Header */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-600">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 via-blue-600 to-indigo-600 rounded-lg flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-lg">#{index + 1}</span>
            </div>
            <div>
              <p className="font-bold text-white text-xl tracking-wide">
                {team.team_name || `Team #${index + 1}`}
              </p>
              <p className="text-sm text-gray-400 font-medium">
                {teamMembers.length} / {teamSize} Players
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge 
              variant="outline" 
              className={`${
                teamMembers.length >= teamSize
                  ? 'bg-green-500/20 text-green-400 border-green-500/50 font-bold' 
                  : 'bg-blue-500/20 text-blue-400 border-blue-500/50 font-bold'
              } px-3 py-1`}
            >
              {teamMembers.length >= teamSize ? '✓ Full Roster' : `${emptySlots} Slots Open`}
            </Badge>
            
            {isCaptain && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-9 w-9 p-0 text-gray-400 hover:text-white hover:bg-gray-700">
                    <MoreVertical className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-gray-800 border-gray-600">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-red-400 focus:text-red-300">
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete Team
                      </DropdownMenuItem>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="bg-gray-900 border-gray-700">
                      <AlertDialogHeader>
                        <AlertDialogTitle className="text-white">Delete Team</AlertDialogTitle>
                        <AlertDialogDescription className="text-gray-300">
                          Are you sure you want to delete this team? This action cannot be undone and will remove all team members.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel className="bg-gray-700 text-white border-gray-600">Cancel</AlertDialogCancel>
                        <AlertDialogAction 
                          onClick={handleDeleteTeam}
                          disabled={isDeleting}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          {isDeleting ? "Deleting..." : "Delete Team"}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
        
        {/* 5-Player Roster Card Layout */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {/* Filled slots */}
          {teamMembers.map((member, memberIndex) => (
            <div 
              key={member.id} 
              className="relative group bg-gradient-to-b from-gray-700/60 to-gray-800/80 rounded-xl p-4 border-2 border-gray-600 hover:border-purple-500/50 transition-all hover:shadow-lg hover:scale-105"
            >
              {/* Player Number Badge */}
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full flex items-center justify-center shadow-md border-2 border-gray-800">
                <span className="text-white font-bold text-sm">{memberIndex + 1}</span>
              </div>
              
              {/* Captain Crown */}
              {member.is_team_captain && (
                <div className="absolute -top-3 -right-2 w-7 h-7 bg-yellow-500 rounded-full flex items-center justify-center shadow-lg border-2 border-gray-800">
                  <Crown className="w-4 h-4 text-gray-900" />
                </div>
              )}
              
              {/* Player Avatar Placeholder */}
              <div className="w-16 h-16 mx-auto mb-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-2xl">{member.player_name.charAt(0).toUpperCase()}</span>
              </div>
              
              {/* Player Info */}
              <div className="text-center space-y-1">
                <p className="text-sm font-bold text-white truncate px-1">
                  {member.player_name}
                </p>
                {member.is_team_captain && (
                  <p className="text-xs text-yellow-400 font-medium">Captain</p>
                )}
                <div className="pt-2 border-t border-gray-600">
                  <p className="text-xs text-gray-400 font-mono truncate px-1">
                    {member.player_game_id}
                  </p>
                </div>
              </div>
              
              {/* Remove player button (only for captain and not for captain themselves) */}
              {isCaptain && !member.is_team_captain && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="absolute bottom-2 right-2 h-7 w-7 p-0 text-red-400 hover:text-red-300 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <UserMinus className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="bg-gray-900 border-gray-700">
                    <AlertDialogHeader>
                      <AlertDialogTitle className="text-white">Remove Player</AlertDialogTitle>
                      <AlertDialogDescription className="text-gray-300">
                        Are you sure you want to remove {member.player_name} from the team?
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="bg-gray-700 text-white border-gray-600">Cancel</AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={() => handleRemoveMember(member.id, member.player_name)}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        Remove Player
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          ))}
          
          {/* Empty slots */}
          {Array.from({ length: emptySlots }).map((_, slotIndex) => (
            <div 
              key={`empty-${slotIndex}`} 
              className="relative bg-gray-800/40 rounded-xl p-4 border-2 border-dashed border-gray-600"
            >
              {/* Slot Number Badge */}
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center shadow-md border-2 border-gray-800">
                <span className="text-gray-400 font-bold text-sm">{teamMembers.length + slotIndex + 1}</span>
              </div>
              
              {/* Empty Avatar */}
              <div className="w-16 h-16 mx-auto mb-3 bg-gray-700/50 rounded-full flex items-center justify-center">
                <span className="text-gray-500 text-3xl">?</span>
              </div>
              
              {/* Empty Slot Text */}
              <div className="text-center space-y-1">
                <p className="text-sm text-gray-500 italic font-medium">
                  Empty Slot
                </p>
                <p className="text-xs text-gray-600">
                  Waiting...
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Default layout for Squad/Duo tournaments
  return (
    <div className="p-4 rounded-lg bg-gray-700/50 border border-gray-600">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full flex items-center justify-center">
            <span className="text-white font-bold text-sm">#{index + 1}</span>
          </div>
          <div>
            <p className="font-bold text-white text-lg">
              {team.team_name || `Team #${index + 1}`}
            </p>
            <p className="text-sm text-gray-400">
              {teamMembers.length} / {teamSize} players
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge 
            variant="outline" 
            className={`${
              teamMembers.length >= teamSize
                ? 'bg-green-500/20 text-green-400 border-green-500/30' 
                : 'bg-blue-500/20 text-blue-400 border-blue-500/30'
            }`}
          >
            {teamMembers.length >= teamSize ? 'Full' : `${emptySlots} slots left`}
          </Badge>
          
          {isCaptain && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-gray-400 hover:text-white">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-gray-800 border-gray-600">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-red-400 focus:text-red-300">
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete Team
                    </DropdownMenuItem>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="bg-gray-900 border-gray-700">
                    <AlertDialogHeader>
                      <AlertDialogTitle className="text-white">Delete Team</AlertDialogTitle>
                      <AlertDialogDescription className="text-gray-300">
                        Are you sure you want to delete this team? This action cannot be undone and will remove all team members.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="bg-gray-700 text-white border-gray-600">Cancel</AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={handleDeleteTeam}
                        disabled={isDeleting}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        {isDeleting ? "Deleting..." : "Delete Team"}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
      
      {/* Team Members Grid */}
      <div className="grid grid-cols-2 gap-3">
        {/* Filled slots */}
        {teamMembers.map((member, memberIndex) => (
          <div key={member.id} className="flex items-center gap-3 p-3 bg-gray-800/50 rounded-lg border border-gray-600">
            <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-xs">{memberIndex + 1}</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                {member.is_team_captain && <Crown className="w-3 h-3 text-yellow-500 flex-shrink-0" />}
                <p className="text-sm font-medium text-white truncate">
                  {member.player_name}
                </p>
              </div>
              {member.is_team_captain && (
                <p className="text-xs text-yellow-400">Captain</p>
              )}
              <p className="text-xs text-gray-400 truncate">ID: {member.player_game_id}</p>
            </div>
            
            {/* Remove player button (only for captain and not for captain themselves) */}
            {isCaptain && !member.is_team_captain && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-red-400 hover:text-red-300">
                    <UserMinus className="h-3 w-3" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="bg-gray-900 border-gray-700">
                  <AlertDialogHeader>
                    <AlertDialogTitle className="text-white">Remove Player</AlertDialogTitle>
                    <AlertDialogDescription className="text-gray-300">
                      Are you sure you want to remove {member.player_name} from the team?
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="bg-gray-700 text-white border-gray-600">Cancel</AlertDialogCancel>
                    <AlertDialogAction 
                      onClick={() => handleRemoveMember(member.id, member.player_name)}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      Remove Player
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        ))}
        
        {/* Empty slots */}
        {Array.from({ length: emptySlots }).map((_, slotIndex) => (
          <div key={`empty-${slotIndex}`} className="flex items-center gap-3 p-3 bg-gray-800/30 rounded-lg border border-gray-600 border-dashed">
            <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
              <span className="text-gray-400 font-bold text-xs">{teamMembers.length + slotIndex + 1}</span>
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-500 italic">Empty Slot</p>
              <p className="text-xs text-gray-600">Waiting for player...</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TeamCard;