export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      admin_users: {
        Row: {
          created_at: string
          created_by: string | null
          email: string
          id: string
          is_active: boolean
          password_hash: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          email: string
          id?: string
          is_active?: boolean
          password_hash: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          email?: string
          id?: string
          is_active?: boolean
          password_hash?: string
        }
        Relationships: []
      }
      announcements: {
        Row: {
          content: string
          created_at: string
          id: string
          is_active: boolean | null
          priority: string | null
          title: string
          type: string | null
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          priority?: string | null
          title: string
          type?: string | null
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          priority?: string | null
          title?: string
          type?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      leaderboards: {
        Row: {
          avatar_url: string | null
          created_at: string
          id: string
          kills: number | null
          player_name: string
          rank: number
          score: number | null
          tournament_id: string | null
          updated_at: string
          wins: number | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          id?: string
          kills?: number | null
          player_name: string
          rank: number
          score?: number | null
          tournament_id?: string | null
          updated_at?: string
          wins?: number | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          id?: string
          kills?: number | null
          player_name?: string
          rank?: number
          score?: number | null
          tournament_id?: string | null
          updated_at?: string
          wins?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "leaderboards_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
        ]
      }
      live_match_admin: {
        Row: {
          banner_url: string | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          title: string
          tournament_id: string | null
          updated_at: string
          youtube_live_url: string | null
        }
        Insert: {
          banner_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          title: string
          tournament_id?: string | null
          updated_at?: string
          youtube_live_url?: string | null
        }
        Update: {
          banner_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          title?: string
          tournament_id?: string | null
          updated_at?: string
          youtube_live_url?: string | null
        }
        Relationships: []
      }
      live_matches: {
        Row: {
          created_at: string
          duration: string | null
          game: string
          id: string
          phase: string | null
          prize: string | null
          score_1: number | null
          score_2: number | null
          status: string | null
          stream_url: string | null
          team_1: string | null
          team_2: string | null
          thumbnail_url: string | null
          tournament_id: string | null
          tournament_name: string
          updated_at: string
          viewers: number | null
        }
        Insert: {
          created_at?: string
          duration?: string | null
          game: string
          id?: string
          phase?: string | null
          prize?: string | null
          score_1?: number | null
          score_2?: number | null
          status?: string | null
          stream_url?: string | null
          team_1?: string | null
          team_2?: string | null
          thumbnail_url?: string | null
          tournament_id?: string | null
          tournament_name: string
          updated_at?: string
          viewers?: number | null
        }
        Update: {
          created_at?: string
          duration?: string | null
          game?: string
          id?: string
          phase?: string | null
          prize?: string | null
          score_1?: number | null
          score_2?: number | null
          status?: string | null
          stream_url?: string | null
          team_1?: string | null
          team_2?: string | null
          thumbnail_url?: string | null
          tournament_id?: string | null
          tournament_name?: string
          updated_at?: string
          viewers?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "live_matches_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
        ]
      }
      matches: {
        Row: {
          created_at: string
          game: string
          id: string
          player1: string
          player1_score: number
          player2: string
          player2_score: number
          start_time: string
          status: string
          thumbnail: string | null
          tournament_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          game: string
          id?: string
          player1: string
          player1_score?: number
          player2: string
          player2_score?: number
          start_time?: string
          status?: string
          thumbnail?: string | null
          tournament_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          game?: string
          id?: string
          player1?: string
          player1_score?: number
          player2?: string
          player2_score?: number
          start_time?: string
          status?: string
          thumbnail?: string | null
          tournament_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "matches_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
        ]
      }
      players: {
        Row: {
          avatar: string | null
          country: string | null
          created_at: string
          earnings: number
          id: string
          losses: number
          name: string
          points: number
          rank: number
          team: string | null
          tournaments_won: number
          updated_at: string
          win_rate: number
          wins: number
        }
        Insert: {
          avatar?: string | null
          country?: string | null
          created_at?: string
          earnings?: number
          id?: string
          losses?: number
          name: string
          points?: number
          rank?: number
          team?: string | null
          tournaments_won?: number
          updated_at?: string
          win_rate?: number
          wins?: number
        }
        Update: {
          avatar?: string | null
          country?: string | null
          created_at?: string
          earnings?: number
          id?: string
          losses?: number
          name?: string
          points?: number
          rank?: number
          team?: string | null
          tournaments_won?: number
          updated_at?: string
          win_rate?: number
          wins?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          earnings: number | null
          email: string | null
          first_name: string | null
          game_id: string | null
          id: string
          last_name: string | null
          name: string | null
          phone_number: string | null
          updated_at: string
          user_id: string
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          earnings?: number | null
          email?: string | null
          first_name?: string | null
          game_id?: string | null
          id?: string
          last_name?: string | null
          name?: string | null
          phone_number?: string | null
          updated_at?: string
          user_id: string
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          earnings?: number | null
          email?: string | null
          first_name?: string | null
          game_id?: string | null
          id?: string
          last_name?: string | null
          name?: string | null
          phone_number?: string | null
          updated_at?: string
          user_id?: string
          username?: string | null
        }
        Relationships: []
      }
      sponsors: {
        Row: {
          created_at: string
          description: string | null
          display_order: number
          id: string
          is_active: boolean
          logo: string | null
          name: string
          updated_at: string
          website: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          is_active?: boolean
          logo?: string | null
          name: string
          updated_at?: string
          website?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          is_active?: boolean
          logo?: string | null
          name?: string
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      tournament_participants: {
        Row: {
          id: string
          joined_at: string
          profile_id: string
          status: string | null
          tournament_id: string
          user_id: string
        }
        Insert: {
          id?: string
          joined_at?: string
          profile_id: string
          status?: string | null
          tournament_id: string
          user_id: string
        }
        Update: {
          id?: string
          joined_at?: string
          profile_id?: string
          status?: string | null
          tournament_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tournament_participants_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tournament_participants_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
        ]
      }
      tournament_points: {
        Row: {
          created_at: string
          group_name: string | null
          id: string
          kills: number
          points: number
          position: number
          position_in_group: number | null
          team_id: string
          team_name: string
          tournament_id: string
          updated_at: string
          wins: number
        }
        Insert: {
          created_at?: string
          group_name?: string | null
          id?: string
          kills?: number
          points?: number
          position?: number
          position_in_group?: number | null
          team_id: string
          team_name: string
          tournament_id: string
          updated_at?: string
          wins?: number
        }
        Update: {
          created_at?: string
          group_name?: string | null
          id?: string
          kills?: number
          points?: number
          position?: number
          position_in_group?: number | null
          team_id?: string
          team_name?: string
          tournament_id?: string
          updated_at?: string
          wins?: number
        }
        Relationships: [
          {
            foreignKeyName: "tournament_points_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "tournament_teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tournament_points_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
        ]
      }
      tournament_registrations: {
        Row: {
          created_at: string | null
          game_id: string
          id: string
          payment_amount: number | null
          payment_status: string | null
          player_name: string
          status: string | null
          tournament_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          game_id: string
          id?: string
          payment_amount?: number | null
          payment_status?: string | null
          player_name: string
          status?: string | null
          tournament_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          game_id?: string
          id?: string
          payment_amount?: number | null
          payment_status?: string | null
          player_name?: string
          status?: string | null
          tournament_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tournament_registrations_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
        ]
      }
      tournament_rooms: {
        Row: {
          created_at: string
          id: string
          room_id: string | null
          room_password: string | null
          tournament_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          room_id?: string | null
          room_password?: string | null
          tournament_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          room_id?: string | null
          room_password?: string | null
          tournament_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tournament_rooms_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: true
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
        ]
      }
      tournament_team_members: {
        Row: {
          id: string
          joined_at: string
          role: string
          team_id: string
          user_id: string
        }
        Insert: {
          id?: string
          joined_at?: string
          role?: string
          team_id: string
          user_id: string
        }
        Update: {
          id?: string
          joined_at?: string
          role?: string
          team_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tournament_team_members_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "tournament_teams"
            referencedColumns: ["id"]
          },
        ]
      }
      tournament_teams: {
        Row: {
          captain_user_id: string
          created_at: string
          current_members: number
          id: string
          is_full: boolean
          max_members: number
          status: string
          team_name: string
          tournament_id: string
          updated_at: string
        }
        Insert: {
          captain_user_id: string
          created_at?: string
          current_members?: number
          id?: string
          is_full?: boolean
          max_members: number
          status?: string
          team_name: string
          tournament_id: string
          updated_at?: string
        }
        Update: {
          captain_user_id?: string
          created_at?: string
          current_members?: number
          id?: string
          is_full?: boolean
          max_members?: number
          status?: string
          team_name?: string
          tournament_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tournament_teams_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
        ]
      }
      tournament_winners: {
        Row: {
          created_at: string | null
          id: string
          player_name: string
          position: number
          prize_amount: string | null
          tournament_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          player_name: string
          position: number
          prize_amount?: string | null
          tournament_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          player_name?: string
          position?: number
          prize_amount?: string | null
          tournament_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tournament_winners_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
        ]
      }
      tournaments: {
        Row: {
          banner_url: string | null
          created_at: string
          current_participants: number | null
          description: string | null
          end_date: string | null
          entry_fee: string | null
          format: string | null
          game: string
          id: string
          image_url: string | null
          max_participants: number | null
          name: string
          organizer: string | null
          overview_content: Json | null
          prize_pool: string | null
          prizes_content: Json | null
          region: string | null
          registration_end_time: string | null
          registration_start_time: string | null
          rules: string | null
          schedule: string | null
          schedule_content: Json | null
          start_date: string | null
          status: string | null
          team_mode: string | null
          team_size: number | null
          timer_duration: number | null
          timer_is_running: boolean
          timer_start_time: string | null
          tournament_type: string | null
          updated_at: string
        }
        Insert: {
          banner_url?: string | null
          created_at?: string
          current_participants?: number | null
          description?: string | null
          end_date?: string | null
          entry_fee?: string | null
          format?: string | null
          game: string
          id?: string
          image_url?: string | null
          max_participants?: number | null
          name: string
          organizer?: string | null
          overview_content?: Json | null
          prize_pool?: string | null
          prizes_content?: Json | null
          region?: string | null
          registration_end_time?: string | null
          registration_start_time?: string | null
          rules?: string | null
          schedule?: string | null
          schedule_content?: Json | null
          start_date?: string | null
          status?: string | null
          team_mode?: string | null
          team_size?: number | null
          timer_duration?: number | null
          timer_is_running?: boolean
          timer_start_time?: string | null
          tournament_type?: string | null
          updated_at?: string
        }
        Update: {
          banner_url?: string | null
          created_at?: string
          current_participants?: number | null
          description?: string | null
          end_date?: string | null
          entry_fee?: string | null
          format?: string | null
          game?: string
          id?: string
          image_url?: string | null
          max_participants?: number | null
          name?: string
          organizer?: string | null
          overview_content?: Json | null
          prize_pool?: string | null
          prizes_content?: Json | null
          region?: string | null
          registration_end_time?: string | null
          registration_start_time?: string | null
          rules?: string | null
          schedule?: string | null
          schedule_content?: Json | null
          start_date?: string | null
          status?: string | null
          team_mode?: string | null
          team_size?: number | null
          timer_duration?: number | null
          timer_is_running?: boolean
          timer_start_time?: string | null
          tournament_type?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      wallet_balances: {
        Row: {
          available_balance: number
          created_at: string
          id: string
          pending_balance: number
          total_deposited: number
          total_withdrawn: number
          updated_at: string
          user_id: string
        }
        Insert: {
          available_balance?: number
          created_at?: string
          id?: string
          pending_balance?: number
          total_deposited?: number
          total_withdrawn?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          available_balance?: number
          created_at?: string
          id?: string
          pending_balance?: number
          total_deposited?: number
          total_withdrawn?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      wallet_transactions: {
        Row: {
          admin_notes: string | null
          amount: number
          approved_at: string | null
          approved_by: string | null
          created_at: string
          id: string
          payment_method: string | null
          status: string
          tournament_id: string | null
          tournament_name: string | null
          transaction_reference: string | null
          transaction_type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          amount: number
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          id?: string
          payment_method?: string | null
          status?: string
          tournament_id?: string | null
          tournament_name?: string | null
          transaction_reference?: string | null
          transaction_type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          amount?: number
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          id?: string
          payment_method?: string | null
          status?: string
          tournament_id?: string | null
          tournament_name?: string | null
          transaction_reference?: string | null
          transaction_type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wallet_transactions_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin_user: { Args: { user_email: string }; Returns: boolean }
      is_current_user_admin: { Args: never; Returns: boolean }
      is_current_user_super_admin: { Args: never; Returns: boolean }
      refresh_team_member_counts: { Args: never; Returns: undefined }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
