import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { walletService, WalletBalance, WalletTransaction } from '@/services/walletService';
import { tournamentRegistrationService, TournamentRegistration } from '@/services/tournamentRegistrationService';
import Layout from '@/components/layout/Layout';
import { 
  User, 
  Trophy, 
  Wallet, 
  Edit, 
  Save, 
  X, 
  TrendingUp, 
  Clock, 
  CheckCircle, 
  GamepadIcon, 
  Award, 
  Target 
} from 'lucide-react';

interface UserProfile {
  id: string;
  user_id: string;
  name?: string;
  email?: string;
  game_id?: string;
  display_name?: string;
  avatar_url?: string;
  earnings?: number;
  created_at: string;
}

const Profile: React.FC = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [walletBalance, setWalletBalance] = useState<WalletBalance | null>(null);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [registrations, setRegistrations] = useState<TournamentRegistration[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editProfile, setEditProfile] = useState({
    name: '',
    display_name: '',
    game_id: ''
  });
  const [isLoading, setIsLoading] = useState(false);

  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      loadUserData();
    }
  }, [user]);

  const loadUserData = async () => {
    if (!user) return;

    try {
      // Load user profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      setProfile(profileData);
      setEditProfile({
        name: profileData?.name || '',
        display_name: profileData?.display_name || '',
        game_id: profileData?.game_id || ''
      });

      // Load wallet balance
      const balance = await walletService.getUserBalance(user.id);
      setWalletBalance(balance);

      // Load transactions
      const userTransactions = await walletService.getUserTransactions(user.id);
      setTransactions(userTransactions);

      // Load registrations
      const userRegistrations = await tournamentRegistrationService.getUserRegistrations(user.id);
      setRegistrations(userRegistrations);

    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          user_id: user.id,
          ...editProfile,
          email: user.email
        }, {
          onConflict: 'user_id'
        });

      if (error) throw error;

      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully.",
      });

      setIsEditing(false);
      loadUserData();

    } catch (error: any) {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update profile",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <p className="text-center text-muted-foreground">Please log in to view your profile.</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900">
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          {/* Header */}
          <div className="mb-6 sm:mb-8">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 mb-4">
              <Avatar className="w-16 h-16 sm:w-20 sm:h-20 border-4 border-primary/30">
                <AvatarImage src={profile?.avatar_url} />
                <AvatarFallback className="bg-gradient-to-br from-primary to-purple-600 text-white text-xl sm:text-2xl font-bold">
                  {profile?.name?.charAt(0) || user?.email?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="text-center sm:text-left">
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-2">
                  {profile?.display_name || profile?.name || 'Unnamed Player'}
                </h1>
                <p className="text-muted-foreground text-sm sm:text-base">Esports Player • {user?.email}</p>
                <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 mt-2">
                  <Badge variant="secondary" className="bg-primary/20 text-primary text-xs sm:text-sm">
                    <GamepadIcon className="w-3 h-3 mr-1" />
                    ID: {profile?.game_id || 'Not set'}
                  </Badge>
                  <Badge variant="outline" className="bg-green-500/20 text-green-400 border-green-500/30 text-xs sm:text-sm">
                    <Trophy className="w-3 h-3 mr-1" />
                    ₹{profile?.earnings || 0} earned
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
            {/* Profile Information */}
            <div className="lg:col-span-1">
              <Card className="bg-card/50 backdrop-blur border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-foreground">
                    <User className="w-5 h-5" />
                    Profile Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {isEditing ? (
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="name" className="text-muted-foreground">Name</Label>
                        <Input
                          id="name"
                          value={editProfile.name}
                          onChange={(e) => setEditProfile(prev => ({ ...prev, name: e.target.value }))}
                          className="bg-background/50 border-border"
                        />
                      </div>
                      <div>
                        <Label htmlFor="game_id" className="text-muted-foreground">Game ID</Label>
                        <Input
                          id="game_id"
                          value={editProfile.game_id}
                          onChange={(e) => setEditProfile(prev => ({ ...prev, game_id: e.target.value }))}
                          className="bg-background/50 border-border"
                        />
                      </div>
                      <div>
                        <Label htmlFor="display_name" className="text-muted-foreground">Display Name</Label>
                        <Input
                          id="display_name"
                          value={editProfile.display_name}
                          onChange={(e) => setEditProfile(prev => ({ ...prev, display_name: e.target.value }))}
                          className="bg-background/50 border-border"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button onClick={handleSaveProfile} disabled={isLoading} className="flex-1">
                          <Save className="w-4 h-4 mr-2" />
                          Save
                        </Button>
                        <Button variant="outline" onClick={() => setIsEditing(false)} className="flex-1">
                          <X className="w-4 h-4 mr-2" />
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-muted-foreground text-sm">Name</p>
                          <p className="text-foreground font-medium">{profile?.name || 'Not set'}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-sm">Game ID</p>
                          <p className="text-foreground font-medium">{profile?.game_id || 'Not set'}</p>
                        </div>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-sm">Display Name</p>
                        <p className="text-foreground font-medium">{profile?.display_name || 'Not set'}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-sm">Email</p>
                        <p className="text-foreground font-medium">{user?.email}</p>
                      </div>
                      <Separator />
                      <Button onClick={() => setIsEditing(true)} className="w-full">
                        <Edit className="w-4 h-4 mr-2" />
                        Edit Profile
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Quick Stats */}
              <Card className="bg-card/50 backdrop-blur border-border/50 mt-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-foreground">
                    <Target className="w-5 h-5" />
                    Quick Stats
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-primary/10 rounded-lg">
                      <Award className="w-6 h-6 mx-auto mb-2 text-primary" />
                      <p className="text-2xl font-bold text-foreground">{registrations.length}</p>
                      <p className="text-sm text-muted-foreground">Tournaments</p>
                    </div>
                    <div className="text-center p-3 bg-green-500/10 rounded-lg">
                      <Trophy className="w-6 h-6 mx-auto mb-2 text-green-500" />
                      <p className="text-2xl font-bold text-foreground">₹{profile?.earnings || 0}</p>
                      <p className="text-sm text-muted-foreground">Earnings</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Wallet */}
            <div className="lg:col-span-1">
              <Card className="bg-gradient-to-br from-green-900/20 via-emerald-900/10 to-green-900/20 border-green-500/30 backdrop-blur">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-foreground">
                    <Wallet className="w-5 h-5 text-green-500" />
                    Wallet Balance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center space-y-4">
                    <div className="p-6 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-xl border border-green-500/30">
                      <p className="text-muted-foreground text-sm mb-2">Available Balance</p>
                      <p className="text-4xl font-bold text-green-400 drop-shadow-lg">
                        ₹{walletBalance?.available_balance || 0}
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="p-3 bg-primary/10 rounded-lg border border-primary/20">
                        <p className="text-muted-foreground">Total Deposited</p>
                        <p className="text-foreground font-bold text-lg">₹{walletBalance?.total_deposited || 0}</p>
                      </div>
                      <div className="p-3 bg-red-500/10 rounded-lg border border-red-500/20">
                        <p className="text-muted-foreground">Total Withdrawn</p>
                        <p className="text-foreground font-bold text-lg">₹{walletBalance?.total_withdrawn || 0}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Transactions */}
              <Card className="bg-card/50 backdrop-blur border-border/50 mt-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-foreground">
                    <TrendingUp className="w-5 h-5" />
                    Recent Transactions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-80 overflow-y-auto">
                    {transactions.slice(0, 5).map((transaction) => (
                      <div key={transaction.id} className="flex items-center justify-between p-3 bg-background/30 rounded-lg border border-border/50">
                        <div className="flex items-center gap-3">
                          {transaction.status === 'approved' ? (
                            <CheckCircle className="w-4 h-4 text-green-400" />
                          ) : (
                            <Clock className="w-4 h-4 text-yellow-400" />
                          )}
                          <div>
                            <p className="text-foreground text-sm font-medium">
                              {transaction.transaction_type === 'deposit' ? 'Deposit' : 'Withdrawal'}
                            </p>
                            <p className="text-muted-foreground text-xs">
                              {new Date(transaction.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`font-bold ${
                            transaction.transaction_type === 'deposit' ? 'text-green-400' : 'text-red-400'
                          }`}>
                            {transaction.transaction_type === 'deposit' ? '+' : '-'}₹{transaction.amount}
                          </p>
                          <Badge 
                            variant={transaction.status === 'approved' ? 'default' : 'outline'} 
                            className="text-xs"
                          >
                            {transaction.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                    {transactions.length === 0 && (
                      <p className="text-muted-foreground text-center py-8">No transactions yet</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Tournament History */}
            <div className="lg:col-span-1">
              <Card className="bg-card/50 backdrop-blur border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-foreground">
                    <Trophy className="w-5 h-5" />
                    Tournament History
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-80 overflow-y-auto">
                    {registrations.map((registration) => (
                      <div key={registration.id} className="p-4 bg-gradient-to-r from-primary/5 to-purple-500/5 rounded-lg border border-border/50">
                        <div className="flex items-center justify-between mb-3">
                          <p className="text-foreground font-bold">Tournament #{registration.tournament_id.slice(0, 8)}</p>
                          <Badge 
                            variant={registration.payment_status === 'completed' ? 'default' : 'outline'}
                            className={`text-xs ${
                              registration.payment_status === 'completed' 
                                ? 'bg-green-500/20 text-green-400 border-green-500/30' 
                                : 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                            }`}
                          >
                            {registration.payment_status === 'completed' ? 'Registered' : 'Pending'}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <p className="text-muted-foreground">Player</p>
                            <p className="text-foreground font-medium">{registration.player_name}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Game ID</p>
                            <p className="text-foreground font-medium">{registration.player_game_id}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Entry Fee</p>
                            <p className="text-foreground font-bold">₹{registration.payment_amount}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Date</p>
                            <p className="text-foreground font-medium">{new Date(registration.registration_date).toLocaleDateString()}</p>
                          </div>
                        </div>
                        {registration.team_id && (
                          <div className="mt-2 pt-2 border-t border-border/50">
                            <p className="text-xs text-muted-foreground">
                              Team Registration {registration.is_team_captain && '(Captain)'}
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                    {registrations.length === 0 && (
                      <div className="text-center py-8">
                        <Trophy className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                        <p className="text-muted-foreground">No tournament registrations yet</p>
                        <p className="text-sm text-muted-foreground mt-1">Join your first tournament to get started!</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Profile;