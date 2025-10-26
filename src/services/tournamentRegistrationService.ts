import { supabase } from '@/integrations/supabase/client';

export interface TournamentRegistration {
  id: string;
  user_id: string;
  tournament_id: string;
  player_name: string;
  game_id: string;
  status: string;
  created_at: string;
  updated_at: string;
  // Optional legacy fields (for UI compatibility)
  player_game_id?: string;
  registration_date?: string;
  payment_status?: 'pending' | 'completed' | 'failed';
  payment_amount?: number;
  team_id?: string;
  is_team_captain?: boolean;
}

export interface TournamentRegistrationInput {
  tournament_id: string;
  player_name: string;
  game_id?: string;
  player_game_id?: string;
  payment_amount?: number;
}

// Optional legacy types for team flows
export interface TeamRegistrationInput {
  tournament_id: string;
  team_name: string;
  team_size: number;
  player_name: string;
  game_id?: string;
  payment_amount?: number;
  player_game_id?: string;
}

export interface TournamentRoom {
  id: string;
  tournament_id: string;
  room_id?: string;
  room_password?: string;
  created_at: string;
  updated_at: string;
}

export const tournamentRegistrationService = {
  async registerForTournament(registration: TournamentRegistrationInput): Promise<TournamentRegistration> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('tournament_registrations')
      .insert([
        {
          user_id: user.id,
          tournament_id: registration.tournament_id,
          player_name: registration.player_name,
          game_id: registration.game_id ?? registration.player_game_id ?? '',
          payment_status: 'completed',
          payment_amount: registration.payment_amount ?? 0,
        },
      ])
      .select()
      .single();

    if (error) throw error;
    // Map for UI compatibility
    return {
      ...(data as any),
      player_game_id: (data as any).game_id,
      registration_date: (data as any).created_at,
    } as TournamentRegistration;
  },

  async getUserRegistrations(userId: string): Promise<TournamentRegistration[]> {
    const { data, error } = await supabase
      .from('tournament_registrations')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map((row: any) => ({
      ...row,
      player_game_id: row.game_id,
      registration_date: row.created_at,
    })) as TournamentRegistration[];
  },

  async getTournamentRegistrations(tournamentId: string): Promise<TournamentRegistration[]> {
    const { data, error } = await supabase
      .from('tournament_registrations')
      .select('*')
      .eq('tournament_id', tournamentId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return (data || []).map((row: any) => ({
      ...row,
      player_game_id: row.game_id,
      registration_date: row.created_at,
    })) as TournamentRegistration[];
  },

  async checkUserRegistration(userId: string, tournamentId: string): Promise<TournamentRegistration | null> {
    const { data, error } = await supabase
      .from('tournament_registrations')
      .select('*')
      .eq('user_id', userId)
      .eq('tournament_id', tournamentId)
      .maybeSingle();

    if (error) throw error;
    return data
      ? ({
          ...(data as any),
          player_game_id: (data as any).game_id,
          registration_date: (data as any).created_at,
        } as TournamentRegistration)
      : null;
  },

  async updateStatus(registrationId: string, status: string): Promise<void> {
    const { error } = await supabase
      .from('tournament_registrations')
      .update({ status })
      .eq('id', registrationId);

    if (error) throw error;
  },

  async getTournamentRoom(tournamentId: string): Promise<TournamentRoom | null> {
    const { data, error } = await supabase
      .from('tournament_rooms')
      .select('*')
      .eq('tournament_id', tournamentId)
      .maybeSingle();

    if (error) throw error;
    return data as TournamentRoom | null;
  },

  async upsertTournamentRoom(
    tournamentId: string,
    roomData: Partial<Pick<TournamentRoom, 'room_id' | 'room_password'>>
  ): Promise<TournamentRoom> {
    const { data, error } = await supabase
      .from('tournament_rooms')
      .upsert(
        {
          tournament_id: tournamentId,
          ...roomData,
        },
        { onConflict: 'tournament_id' }
      )
      .select()
      .single();

    if (error) throw error;
    return data as TournamentRoom;
  },

  // Team flows using tournament_teams and tournament_team_members
  async createTeam(teamData: TeamRegistrationInput): Promise<{ team: any; registration: TournamentRegistration }> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Check if user is already in a team for this tournament (prioritize team membership check)
    const { data: existingTeamMembership } = await supabase
      .from('tournament_team_members')
      .select('team_id, tournament_teams!inner(tournament_id)')
      .eq('user_id', user.id)
      .eq('tournament_teams.tournament_id', teamData.tournament_id);

    if (existingTeamMembership && existingTeamMembership.length > 0) {
      throw new Error('You are already in a team for this tournament');
    }

    // 1) Create team first
    const { data: team, error: teamErr } = await supabase
      .from('tournament_teams')
      .insert([
        {
          tournament_id: teamData.tournament_id,
          captain_user_id: user.id,
          team_name: teamData.team_name,
          max_members: teamData.team_size || 4,
        } as any,
      ])
      .select()
      .single();

    if (teamErr) {
      console.error('Team creation error:', teamErr);
      throw new Error(`Failed to create team: ${teamErr.message}`);
    }

    try {
      // 2) Captain is automatically added by the add_captain_membership() database trigger
      // Wait a moment for the trigger to complete
      await new Promise(resolve => setTimeout(resolve, 300));

      // 3) Create registration row for captain
      const { data: reg, error: regErr } = await supabase
        .from('tournament_registrations')
        .insert([
          {
            user_id: user.id,
            tournament_id: teamData.tournament_id,
            player_name: teamData.player_name,
            game_id: teamData.game_id ?? teamData.player_game_id ?? '',
            status: 'registered',
          },
        ])
        .select()
        .single();

      if (regErr) {
        console.error('Registration error:', regErr);
        throw new Error(`Failed to create registration: ${regErr.message}`);
      }

      // Verify the team was created successfully
      const { data: verifiedTeam, error: verifyError } = await supabase
        .from('tournament_teams')
        .select('*, tournament_team_members(*)')
        .eq('id', team.id)
        .single();

      if (verifyError || !verifiedTeam) {
        console.error('Team verification failed:', verifyError);
        throw new Error('Team creation could not be verified');
      }

      return {
        team: verifiedTeam,
        registration: {
          ...(reg as any),
          player_game_id: (reg as any).game_id,
          registration_date: (reg as any).created_at,
        } as TournamentRegistration,
      };
    } catch (error: any) {
      // Rollback: delete team and members if anything fails
      await supabase.from('tournament_team_members').delete().eq('team_id', team.id);
      await supabase.from('tournament_teams').delete().eq('id', team.id);
      throw error;
    }
  },

  async joinTeam(teamId: string, playerData: Omit<TournamentRegistrationInput, 'game_id'> & { game_id?: string }): Promise<TournamentRegistration> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Get team info first to validate tournament and constraints
    const { data: teamInfo, error: teamInfoError } = await supabase
      .from('tournament_teams')
      .select('tournament_id, current_members, max_members, is_full')
      .eq('id', teamId)
      .single();

    if (teamInfoError || !teamInfo) {
      throw new Error('Team not found');
    }

    // Check if team is full
    if (teamInfo.is_full || teamInfo.current_members >= teamInfo.max_members) {
      throw new Error('Team is full');
    }

    // Check if user is already a member of this specific team
    const { data: existingMember } = await supabase
      .from('tournament_team_members')
      .select('id')
      .eq('team_id', teamId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (existingMember) {
      throw new Error('You are already a member of this team');
    }

    // Check if user is already a member of any team for this tournament
    const { data: userInOtherTeams } = await supabase
      .from('tournament_team_members')
      .select('team_id, tournament_teams!inner(tournament_id)')
      .eq('user_id', user.id)
      .eq('tournament_teams.tournament_id', teamInfo.tournament_id);

    if (userInOtherTeams && userInOtherTeams.length > 0) {
      throw new Error('You are already a member of another team in this tournament');
    }

    // Check if user is already registered for this tournament
    const { data: existingRegistration } = await supabase
      .from('tournament_registrations')
      .select('*')
      .eq('user_id', user.id)
      .eq('tournament_id', teamInfo.tournament_id)
      .maybeSingle();

    if (existingRegistration) {
      throw new Error('You are already registered for this tournament');
    }

    // Start transaction-like operations (create registration first, then join team)
    try {
      // Create registration first
      const { data: registration, error: regErr } = await supabase
        .from('tournament_registrations')
        .insert([
          {
            user_id: user.id,
            tournament_id: teamInfo.tournament_id,
            player_name: playerData.player_name,
            game_id: playerData.game_id ?? playerData.player_game_id ?? '',
            status: 'registered',
          },
        ])
        .select()
        .single();

      if (regErr) {
        throw new Error(`Registration failed: ${regErr.message}`);
      }

      // Now join the team (this will trigger the member count update via database function)
      const { error: joinErr } = await supabase
        .from('tournament_team_members')
        .insert([
          { team_id: teamId, user_id: user.id, role: 'member' },
        ]);

      if (joinErr) {
        // If team join fails, try to clean up the registration
        await supabase
          .from('tournament_registrations')
          .delete()
          .eq('id', registration.id);
        
        throw new Error(`Failed to join team: ${joinErr.message}`);
      }

      return {
        ...(registration as any),
        player_game_id: (registration as any).game_id,
        registration_date: (registration as any).created_at,
      } as TournamentRegistration;

    } catch (error: any) {
      throw new Error(error.message || 'Failed to join team and register');
    }
  },

  async getTournamentTeams(tournamentId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('tournament_teams')
      .select('*')
      .eq('tournament_id', tournamentId)
      .order('created_at', { ascending: true });
    if (error) throw error;
    return data || [];
  },

  async getTeamMembers(teamId: string): Promise<TournamentRegistration[]> {
    // First get the team info
    const { data: teamData, error: teamError } = await supabase
      .from('tournament_teams')
      .select('tournament_id, captain_user_id')
      .eq('id', teamId)
      .single();
    
    if (teamError) throw teamError;
    if (!teamData) return [];
    
    // Get team members with their registration data
    const { data: members, error: membersError } = await supabase
      .from('tournament_team_members')
      .select(`
        id,
        user_id,
        role,
        joined_at
      `)
      .eq('team_id', teamId)
      .order('joined_at', { ascending: true });
    
    if (membersError) throw membersError;
    if (!members || members.length === 0) return [];
    
    // Get all registrations for this tournament and these users
    const { data: registrations, error: regError } = await supabase
      .from('tournament_registrations')
      .select('*')
      .eq('tournament_id', teamData.tournament_id)
      .in('user_id', members.map(member => member.user_id));
    
    if (regError) throw regError;

    // Fetch profile fallbacks for names and game IDs
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('user_id, display_name, name, game_id')
      .in('user_id', members.map(member => member.user_id));

    if (profileError) throw profileError;

    // Map team members with their registration/profile data
    return members.map((row: any) => {
      const registration = (registrations || []).find(reg => reg.user_id === row.user_id);
      const profile = (profiles || []).find(p => p.user_id === row.user_id);
      const isCaptain = row.user_id === teamData.captain_user_id;
      
      return {
        id: row.id,
        user_id: row.user_id,
        tournament_id: teamData.tournament_id,
        player_name: registration?.player_name || profile?.display_name || profile?.name || 'Unknown Player',
        game_id: registration?.game_id || profile?.game_id || '',
        status: registration?.status || 'registered',
        created_at: row.joined_at,
        updated_at: registration?.updated_at || row.joined_at,
        player_game_id: registration?.game_id || profile?.game_id || '',
        registration_date: row.joined_at,
        is_team_captain: isCaptain,
        team_id: teamId,
      };
    });
  },

  async getAvailableTeams(tournamentId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('tournament_teams')
      .select('*')
      .eq('tournament_id', tournamentId)
      .eq('status', 'open')
      .eq('is_full', false)
      .order('created_at', { ascending: true });
    if (error) throw error;
    return data || [];
  },

  async deleteTeam(teamId: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // First check if user is team captain
    const { data: team, error: teamError } = await supabase
      .from('tournament_teams')
      .select('captain_user_id')
      .eq('id', teamId)
      .single();

    if (teamError) throw teamError;
    if (team.captain_user_id !== user.id) {
      throw new Error('Only team captain can delete the team');
    }

    // Delete team members first
    const { error: membersError } = await supabase
      .from('tournament_team_members')
      .delete()
      .eq('team_id', teamId);

    if (membersError) throw membersError;

    // Delete the team
    const { error: teamDeleteError } = await supabase
      .from('tournament_teams')
      .delete()
      .eq('id', teamId);

    if (teamDeleteError) throw teamDeleteError;
  },

  async removeTeamMember(teamId: string, memberId: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // First check if user is team captain
    const { data: team, error: teamError } = await supabase
      .from('tournament_teams')
      .select('captain_user_id')
      .eq('id', teamId)
      .single();

    if (teamError) throw teamError;
    if (team.captain_user_id !== user.id) {
      throw new Error('Only team captain can remove members');
    }

    // Remove the team member
    const { error } = await supabase
      .from('tournament_team_members')
      .delete()
      .eq('id', memberId)
      .eq('team_id', teamId);

    if (error) throw error;
  },
};
