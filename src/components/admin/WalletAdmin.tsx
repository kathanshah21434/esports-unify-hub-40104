import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Check, X, DollarSign, TrendingUp, TrendingDown, Clock, Plus, Trophy, User, Mail } from 'lucide-react';
import { walletService, WalletTransaction } from '@/services/walletService';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const WalletAdmin = () => {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [adminNotes, setAdminNotes] = useState<{ [key: string]: string }>({});
  
  // Add Winnings form state
  const [showAddWinnings, setShowAddWinnings] = useState(false);
  const [winningsForm, setWinningsForm] = useState({
    userEmail: '',
    amount: '',
    tournamentName: '',
    description: ''
  });
  const [searchedUser, setSearchedUser] = useState<any>(null);
  const [searchingUser, setSearchingUser] = useState(false);
  
  const { toast } = useToast();

  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = async () => {
    try {
      const data = await walletService.getTransactionsWithUserInfo();
      setTransactions(data);
    } catch (error) {
      console.error('Failed to load transactions:', error);
      toast({
        title: "Error",
        description: "Failed to load transactions. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApproveTransaction = async (id: string) => {
    setProcessingId(id);
    try {
      await walletService.updateTransactionStatus(id, 'approved', adminNotes[id]);
      toast({
        title: "Transaction Approved",
        description: "The transaction has been approved and the user's balance has been updated.",
      });
      loadTransactions();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to approve transaction. Please try again.",
        variant: "destructive",
      });
    } finally {
      setProcessingId(null);
    }
  };

  const handleRejectTransaction = async (id: string) => {
    setProcessingId(id);
    try {
      await walletService.updateTransactionStatus(id, 'rejected', adminNotes[id]);
      toast({
        title: "Transaction Rejected",
        description: "The transaction has been rejected.",
      });
      loadTransactions();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to reject transaction. Please try again.",
        variant: "destructive",
      });
    } finally {
      setProcessingId(null);
    }
  };

  const searchUserByEmail = async (email: string) => {
    if (!email) {
      setSearchedUser(null);
      return;
    }

    setSearchingUser(true);
    try {
      // First try to find user in profiles table
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', email.toLowerCase())
        .maybeSingle();

      if (profile) {
        setSearchedUser(profile);
        return;
      }

      // If not found in profiles, search by different email formats
      const { data: profileAlt, error: profileAltError } = await supabase
        .from('profiles')
        .select('*')
        .ilike('email', `%${email.toLowerCase()}%`)
        .limit(1)
        .maybeSingle();

      if (profileAlt) {
        setSearchedUser(profileAlt);
        return;
      }

      // If still not found, show error
      toast({
        title: "User Not Found",
        description: "No user found with this email address. Make sure the user has registered and logged in at least once.",
        variant: "destructive",
      });
      setSearchedUser(null);
    } catch (error) {
      console.error('Error searching user:', error);
      toast({
        title: "Search Error",
        description: "An error occurred while searching for the user.",
        variant: "destructive",
      });
      setSearchedUser(null);
    } finally {
      setSearchingUser(false);
    }
  };

  const handleAddWinnings = async () => {
    if (!searchedUser || !winningsForm.amount || !winningsForm.tournamentName) {
      toast({
        title: "Missing Information",
        description: "Please search for a user and fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    const amount = parseFloat(winningsForm.amount);
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount greater than 0.",
        variant: "destructive",
      });
      return;
    }

    try {
      await walletService.createTransaction({
        user_id: searchedUser.user_id,
        transaction_type: 'deposit',
        amount: amount,
        status: 'approved', // Auto-approve tournament winnings
        payment_method: 'Tournament Winnings',
        transaction_reference: `winning_${Date.now()}`,
        admin_notes: `Tournament: ${winningsForm.tournamentName}${winningsForm.description ? ` - ${winningsForm.description}` : ''}`
      });

      toast({
        title: "Winnings Added Successfully",
        description: `₹${amount} has been added to ${searchedUser.name || searchedUser.email}'s wallet as tournament winnings.`,
      });

      // Reset form
      setWinningsForm({
        userEmail: '',
        amount: '',
        tournamentName: '',
        description: ''
      });
      setSearchedUser(null);
      setShowAddWinnings(false);
      
      // Reload transactions
      loadTransactions();
    } catch (error) {
      console.error('Error adding winnings:', error);
      toast({
        title: "Error",
        description: "Failed to add tournament winnings. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-yellow-500"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case 'approved':
        return <Badge className="bg-green-500"><Check className="w-3 h-3 mr-1" />Approved</Badge>;
      case 'rejected':
        return <Badge className="bg-red-500"><X className="w-3 h-3 mr-1" />Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getTransactionIcon = (type: string) => {
    return type === 'deposit' ? 
      <TrendingUp className="w-5 h-5 text-green-400" /> : 
      <TrendingDown className="w-5 h-5 text-red-400" />;
  };

  if (loading) {
    return (
      <Card className="bg-gray-800 border-gray-700">
        <CardContent className="p-6">
          <div className="text-center text-gray-400">Loading transactions...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-green-900/50 to-green-800/50 border-green-500/30">
          <CardContent className="p-6 text-center">
            <DollarSign className="w-8 h-8 text-green-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">
              {transactions.filter(t => t.status === 'pending').length}
            </div>
            <div className="text-green-300 text-sm">Pending Transactions</div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-blue-900/50 to-blue-800/50 border-blue-500/30">
          <CardContent className="p-6 text-center">
            <TrendingUp className="w-8 h-8 text-blue-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">
              {transactions.filter(t => t.transaction_type === 'deposit' && t.status === 'approved').length}
            </div>
            <div className="text-blue-300 text-sm">Approved Deposits</div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-orange-900/50 to-orange-800/50 border-orange-500/30">
          <CardContent className="p-6 text-center">
            <TrendingDown className="w-8 h-8 text-orange-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">
              {transactions.filter(t => t.transaction_type === 'withdrawal' && t.status === 'approved').length}
            </div>
            <div className="text-orange-300 text-sm">Approved Withdrawals</div>
          </CardContent>
        </Card>
      </div>

      {/* Add Tournament Winnings Section */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-white flex items-center">
              <Trophy className="w-5 h-5 mr-2" />
              Add Tournament Winnings
            </CardTitle>
            <Button
              onClick={() => setShowAddWinnings(!showAddWinnings)}
              className="bg-purple-600 hover:bg-purple-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Winnings
            </Button>
          </div>
        </CardHeader>
        {showAddWinnings && (
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="userEmail" className="text-white">User Email</Label>
                <div className="flex space-x-2">
                  <Input
                    id="userEmail"
                    type="email"
                    placeholder="Enter user email address"
                    value={winningsForm.userEmail}
                    onChange={(e) => {
                      setWinningsForm({ ...winningsForm, userEmail: e.target.value });
                    }}
                    className="bg-gray-700 border-gray-600 text-white"
                  />
                  <Button
                    onClick={() => searchUserByEmail(winningsForm.userEmail)}
                    disabled={searchingUser || !winningsForm.userEmail}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {searchingUser ? <Clock className="w-4 h-4" /> : <User className="w-4 h-4" />}
                  </Button>
                </div>
                {searchedUser && (
                  <div className="p-3 bg-green-900/20 border border-green-500/30 rounded-lg">
                    <div className="flex items-center space-x-2 text-green-400">
                      <Check className="w-4 h-4" />
                      <span className="font-medium">User Found:</span>
                    </div>
                    <div className="text-white mt-1">
                      <div>{searchedUser.name || 'No name provided'}</div>
                      <div className="text-sm text-gray-400">{searchedUser.email}</div>
                      {searchedUser.game_id && (
                        <div className="text-xs text-gray-500">Game ID: {searchedUser.game_id}</div>
                      )}
                    </div>
                  </div>
                )}
              </div>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="amount" className="text-white">Winning Amount (₹)</Label>
                  <Input
                    id="amount"
                    type="number"
                    placeholder="Enter winning amount"
                    value={winningsForm.amount}
                    onChange={(e) => setWinningsForm({ ...winningsForm, amount: e.target.value })}
                    className="bg-gray-700 border-gray-600 text-white"
                  />
                </div>
                
                <div>
                  <Label htmlFor="tournamentName" className="text-white">Tournament Name</Label>
                  <Input
                    id="tournamentName"
                    placeholder="Enter tournament name"
                    value={winningsForm.tournamentName}
                    onChange={(e) => setWinningsForm({ ...winningsForm, tournamentName: e.target.value })}
                    className="bg-gray-700 border-gray-600 text-white"
                  />
                </div>
              </div>
            </div>
            
            <div>
              <Label htmlFor="description" className="text-white">Description (Optional)</Label>
              <Textarea
                id="description"
                placeholder="Additional details about the winnings..."
                value={winningsForm.description}
                onChange={(e) => setWinningsForm({ ...winningsForm, description: e.target.value })}
                className="bg-gray-700 border-gray-600 text-white"
              />
            </div>
            
            <div className="flex space-x-2">
              <Button
                onClick={handleAddWinnings}
                disabled={!searchedUser || !winningsForm.amount || !winningsForm.tournamentName}
                className="bg-green-600 hover:bg-green-700"
              >
                <Trophy className="w-4 h-4 mr-2" />
                Add Winnings to Wallet
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowAddWinnings(false);
                  setWinningsForm({ userEmail: '', amount: '', tournamentName: '', description: '' });
                  setSearchedUser(null);
                }}
                className="border-gray-600 text-gray-300 hover:bg-gray-800"
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        )}
      </Card>

      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <DollarSign className="w-5 h-5 mr-2" />
            Wallet Transactions Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {transactions.length === 0 ? (
              <div className="text-center text-gray-400 py-8">
                No transactions found
              </div>
            ) : (
              transactions.map((transaction) => (
                <Card key={transaction.id} className="bg-gray-700 border-gray-600">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        {getTransactionIcon(transaction.transaction_type)}
                        <div>
                          <div className="text-white font-medium">
                            {transaction.transaction_type === 'deposit' ? 'Deposit' : 'Withdrawal'} - ₹{transaction.amount}
                          </div>
                          <div className="text-gray-400 text-sm">
                            User: {transaction.user_name} ({transaction.user_email})
                          </div>
                          {transaction.transaction_type === 'withdrawal' && (
                            <div className="text-gray-400 text-sm">
                              Current Balance: ₹{transaction.user_balance}
                            </div>
                          )}
                          <div className="text-gray-400 text-xs">
                            {new Date(transaction.created_at).toLocaleString()}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        {getStatusBadge(transaction.status)}
                      </div>
                    </div>
                    
                    {transaction.payment_method && (
                      <div className="text-gray-400 text-sm mb-2">
                        Payment Method: {transaction.payment_method}
                      </div>
                    )}
                    
                    {transaction.transaction_reference && (
                      <div className="text-gray-400 text-sm mb-2">
                        Reference: {transaction.transaction_reference}
                      </div>
                    )}
                    
                    {transaction.status === 'pending' && (
                      <div className="mt-4 space-y-3">
                        <Textarea
                          placeholder="Add admin notes (optional)"
                          value={adminNotes[transaction.id] || ''}
                          onChange={(e) => setAdminNotes({
                            ...adminNotes,
                            [transaction.id]: e.target.value
                          })}
                          className="bg-gray-600 border-gray-500 text-white"
                        />
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            className="bg-green-600 hover:bg-green-700"
                            onClick={() => handleApproveTransaction(transaction.id)}
                            disabled={processingId === transaction.id}
                          >
                            <Check className="w-4 h-4 mr-1" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleRejectTransaction(transaction.id)}
                            disabled={processingId === transaction.id}
                          >
                            <X className="w-4 h-4 mr-1" />
                            Reject
                          </Button>
                        </div>
                      </div>
                    )}
                    
                    {transaction.admin_notes && (
                      <div className="mt-3 p-3 bg-gray-600 rounded">
                        <div className="text-gray-300 text-sm">
                          <strong>Admin Notes:</strong> {transaction.admin_notes}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default WalletAdmin;