import { useState, useEffect } from 'react';
import { Plus, Minus, DollarSign, TrendingUp, TrendingDown, Clock, CheckCircle, XCircle, QrCode, Phone, CreditCard, User, Download } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import Layout from '@/components/layout/Layout';
import { walletService, WalletBalance, WalletTransaction } from '@/services/walletService';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { qrCodeService, QRCode } from '@/services/qrCodeService';

const Wallet = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [balance, setBalance] = useState<WalletBalance | null>(null);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeQRCode, setActiveQRCode] = useState<QRCode | null>(null);
  
  // Add Money State
  const [showAddMoney, setShowAddMoney] = useState(false);
  const [addAmount, setAddAmount] = useState('');
  const [showQRPayment, setShowQRPayment] = useState(false);
  const [paymentDetails, setPaymentDetails] = useState({
    name: '',
    transactionId: '',
    mobile: ''
  });
  
  // Withdraw State
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawDetails, setWithdrawDetails] = useState({
    upiId: '',
    name: '',
    mobile: ''
  });

  useEffect(() => {
    if (user) {
      loadWalletData();
    }
    loadActiveQRCode();
  }, [user]);

  const loadActiveQRCode = async () => {
    try {
      const qrCode = await qrCodeService.getActiveQRCode();
      setActiveQRCode(qrCode);
    } catch (error) {
      console.error('Failed to load active QR code:', error);
    }
  };

  const loadWalletData = async () => {
    if (!user) return;
    
    try {
      const [userBalance, userTransactions] = await Promise.all([
        walletService.getUserBalance(user.id),
        walletService.getUserTransactions(user.id)
      ]);
      
      setBalance(userBalance);
      setTransactions(userTransactions);
    } catch (error) {
      console.error('Failed to load wallet data:', error);
      toast({
        title: "Error",
        description: "Failed to load wallet data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddMoneyClick = () => {
    if (!addAmount || parseFloat(addAmount) <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount.",
        variant: "destructive",
      });
      return;
    }
    setShowQRPayment(true);
  };

  const handleQRPaymentSubmit = async () => {
    if (!user || !paymentDetails.name || !paymentDetails.transactionId || !paymentDetails.mobile) {
      toast({
        title: "Missing Information",
        description: "Please fill all required fields.",
        variant: "destructive",
      });
      return;
    }

    try {
      await walletService.createTransaction({
        user_id: user.id,
        transaction_type: 'deposit',
        amount: parseFloat(addAmount),
        status: 'pending',
        payment_method: 'Google Pay',
        transaction_reference: paymentDetails.transactionId,
        admin_notes: `Name: ${paymentDetails.name}, Mobile: ${paymentDetails.mobile}`
      });

      toast({
        title: "Deposit Request Submitted",
        description: "Your deposit request has been submitted for admin approval.",
      });

      // Reset states
      setShowQRPayment(false);
      setShowAddMoney(false);
      setAddAmount('');
      setPaymentDetails({ name: '', transactionId: '', mobile: '' });
      
      // Reload data
      loadWalletData();
    } catch (error) {
      console.error('Failed to create transaction:', error);
      toast({
        title: "Error",
        description: "Failed to submit deposit request. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleWithdraw = async () => {
    if (!user || !withdrawAmount || parseFloat(withdrawAmount) <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount.",
        variant: "destructive",
      });
      return;
    }

    if (!withdrawDetails.upiId || !withdrawDetails.name || !withdrawDetails.mobile) {
      toast({
        title: "Missing Information",
        description: "Please fill all required fields.",
        variant: "destructive",
      });
      return;
    }

    const amount = parseFloat(withdrawAmount);
    if (balance && amount > balance.available_balance) {
      toast({
        title: "Insufficient Balance",
        description: "You don't have enough balance for this withdrawal.",
        variant: "destructive",
      });
      return;
    }

    try {
      await walletService.createTransaction({
        user_id: user.id,
        transaction_type: 'withdrawal',
        amount: amount,
        status: 'pending',
        payment_method: 'UPI Transfer',
        admin_notes: `UPI ID: ${withdrawDetails.upiId}, Name: ${withdrawDetails.name}, Mobile: ${withdrawDetails.mobile}`
      });

      toast({
        title: "Withdrawal Request Submitted",
        description: "Your withdrawal request has been submitted for admin approval.",
      });

      // Reset states
      setShowWithdraw(false);
      setWithdrawAmount('');
      setWithdrawDetails({ upiId: '', name: '', mobile: '' });
      
      // Reload data
      loadWalletData();
    } catch (error) {
      console.error('Failed to create withdrawal:', error);
      toast({
        title: "Error",
        description: "Failed to submit withdrawal request. Please try again.",
        variant: "destructive",
      });
    }
  };

  const downloadQRCode = async () => {
    if (!activeQRCode) {
      toast({
        title: "No QR Code",
        description: "No QR code available for download.",
        variant: "destructive",
      });
      return;
    }

    try {
      // For data URL images (base64), we can download directly
      if (activeQRCode.image_url.startsWith('data:')) {
        const link = document.createElement('a');
        link.href = activeQRCode.image_url;
        link.download = `${activeQRCode.name.replace(/\s+/g, '_')}_QR_Code.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        // For external URLs, fetch and download
        const response = await fetch(activeQRCode.image_url);
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${activeQRCode.name.replace(/\s+/g, '_')}_QR_Code.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }
      
      toast({
        title: "Success",
        description: "QR code downloaded successfully.",
      });
    } catch (error) {
      console.error('Failed to download QR code:', error);
      toast({
        title: "Error",
        description: "Failed to download QR code. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'deposit':
        return <Plus className="w-5 h-5 text-white" />;
      case 'withdrawal':
        return <Minus className="w-5 h-5 text-white" />;
      default:
        return <DollarSign className="w-5 h-5 text-white" />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'rejected':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return null;
    }
  };

  if (!user) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
          <h1 className="text-4xl font-bold text-white mb-4">Please Login</h1>
          <p className="text-gray-400">You need to be logged in to access your wallet.</p>
        </div>
      </Layout>
    );
  }

  if (loading) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
          <div className="text-white">Loading wallet...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-blue-900/20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Animated Header */}
          <div className="text-center mb-12 animate-fade-in">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full mb-6 shadow-xl">
              <DollarSign className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent mb-4">
              My Wallet
            </h1>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Manage your gaming funds with ease. Add money, track transactions, and withdraw your winnings seamlessly.
            </p>
          </div>

          {/* Enhanced Balance Cards */}
          <div className="grid md:grid-cols-3 gap-6 mb-8 animate-scale-in">
            <Card className="relative overflow-hidden bg-gradient-to-br from-green-900/80 via-green-800/60 to-emerald-900/80 border-green-500/30 backdrop-blur-sm hover:scale-105 transition-transform duration-300">
              <div className="absolute inset-0 bg-gradient-to-br from-green-400/10 to-emerald-400/10 opacity-50"></div>
              <CardContent className="relative p-6 text-center">
                <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-emerald-500 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <DollarSign className="w-6 h-6 text-white" />
                </div>
                <div className="text-3xl font-bold text-white mb-2">
                  ₹{balance?.available_balance || 0}
                </div>
                <div className="text-green-300 text-sm font-medium">Available Balance</div>
                <div className="text-green-400/60 text-xs mt-1">Ready to use</div>
              </CardContent>
            </Card>
            
            <Card className="relative overflow-hidden bg-gradient-to-br from-blue-900/80 via-blue-800/60 to-indigo-900/80 border-blue-500/30 backdrop-blur-sm hover:scale-105 transition-transform duration-300">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-400/10 to-indigo-400/10 opacity-50"></div>
              <CardContent className="relative p-6 text-center">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <div className="text-3xl font-bold text-white mb-2">
                  ₹{balance?.total_deposited || 0}
                </div>
                <div className="text-blue-300 text-sm font-medium">Total Deposited</div>
                <div className="text-blue-400/60 text-xs mt-1">All time</div>
              </CardContent>
            </Card>
            
            <Card className="relative overflow-hidden bg-gradient-to-br from-orange-900/80 via-orange-800/60 to-red-900/80 border-orange-500/30 backdrop-blur-sm hover:scale-105 transition-transform duration-300">
              <div className="absolute inset-0 bg-gradient-to-br from-orange-400/10 to-red-400/10 opacity-50"></div>
              <CardContent className="relative p-6 text-center">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-red-500 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <TrendingDown className="w-6 h-6 text-white" />
                </div>
                <div className="text-3xl font-bold text-white mb-2">
                  ₹{balance?.total_withdrawn || 0}
                </div>
                <div className="text-orange-300 text-sm font-medium">Total Withdrawn</div>
                <div className="text-orange-400/60 text-xs mt-1">Earnings</div>
              </CardContent>
            </Card>
          </div>

          {/* Enhanced Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12 animate-slide-in-right">
            <Button 
              onClick={() => setShowAddMoney(true)}
              className="group bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-8 py-4 text-lg font-bold shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300"
              size="lg"
            >
              <Plus className="w-6 h-6 mr-3 group-hover:animate-pulse" />
              Add Money to Wallet
              <div className="absolute inset-0 bg-white/20 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </Button>
            <Button 
              onClick={() => setShowWithdraw(true)}
              className="group bg-gradient-to-r from-red-500/20 to-orange-500/20 border-2 border-red-500/50 hover:border-red-400 text-red-400 hover:text-red-300 hover:bg-red-500/30 px-8 py-4 text-lg font-bold shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300"
              size="lg"
              disabled={!balance || balance.available_balance <= 0}
            >
              <Minus className="w-6 h-6 mr-3 group-hover:animate-pulse" />
              Withdraw Funds
              <div className="absolute inset-0 bg-red-500/10 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </Button>
          </div>

          {/* Enhanced Transaction History */}
          <Card className="bg-gradient-to-br from-gray-800/80 via-gray-900/60 to-purple-900/20 border-purple-500/20 backdrop-blur-sm shadow-2xl animate-fade-in">
            <CardHeader className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 border-b border-purple-500/20">
              <CardTitle className="text-2xl font-bold text-white flex items-center">
                <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg flex items-center justify-center mr-3">
                  <Clock className="w-4 h-4 text-white" />
                </div>
                Transaction History
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                {transactions.map((transaction, index) => (
                  <div 
                    key={transaction.id}
                    className="group relative p-4 bg-gradient-to-r from-gray-700/30 to-gray-800/30 rounded-xl border border-gray-600/50 hover:border-purple-500/50 hover:shadow-lg transition-all duration-300 hover:scale-[1.02]"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    {/* Background glow effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-blue-500/5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    
                    <div className="relative flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-lg ${
                          transaction.transaction_type === 'deposit' 
                            ? 'bg-gradient-to-br from-green-500 to-emerald-600' 
                            : 'bg-gradient-to-br from-red-500 to-orange-600'
                        }`}>
                          {getTransactionIcon(transaction.transaction_type)}
                        </div>
                        <div>
                          <div className="text-white font-semibold text-lg">
                            {transaction.transaction_type === 'deposit' 
                              ? 'Money Added' 
                              : transaction.admin_notes?.startsWith('Tournament:') 
                                ? transaction.admin_notes 
                                : 'Money Withdrawn'
                            }
                          </div>
                          <div className="text-gray-400 text-sm flex items-center space-x-2">
                            <span>{new Date(transaction.created_at).toLocaleDateString()}</span>
                            {transaction.payment_method && (
                              <>
                                <span>•</span>
                                <span className="text-purple-400">{transaction.payment_method}</span>
                              </>
                            )}
                          </div>
                          {transaction.status === 'rejected' && transaction.admin_notes && (
                            <div className="text-red-400 text-sm mt-2 bg-red-900/30 p-3 rounded-lg border-l-4 border-red-500">
                              <strong>Rejection Reason:</strong> {transaction.admin_notes}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="text-right flex items-center space-x-4">
                        <div>
                          <div className={`font-bold text-xl ${
                            transaction.transaction_type === 'deposit' 
                              ? 'text-green-400' 
                              : 'text-red-400'
                          }`}>
                            {transaction.transaction_type === 'deposit' ? '+' : '-'}
                            ₹{transaction.amount}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(transaction.status)}
                          <Badge 
                            className={`px-3 py-1 font-medium ${
                              transaction.status === 'approved' 
                                ? 'bg-green-500/20 text-green-400 border-green-500/30' 
                                : transaction.status === 'pending'
                                ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                                : 'bg-red-500/20 text-red-400 border-red-500/30'
                            }`}
                          >
                            {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {transactions.length === 0 && (
                <div className="text-center py-16">
                  <div className="w-24 h-24 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <DollarSign className="w-12 h-12 text-purple-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-3">No transactions yet</h3>
                  <p className="text-gray-400 max-w-md mx-auto">Your transaction history will appear here once you start adding money or making withdrawals</p>
                  <Button 
                    onClick={() => setShowAddMoney(true)}
                    className="mt-6 bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700"
                  >
                    Add Your First Transaction
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

        {/* Enhanced Add Money Dialog */}
        <Dialog open={showAddMoney} onOpenChange={setShowAddMoney}>
          <DialogContent className="bg-gradient-to-br from-gray-800 to-gray-900 border-purple-500/30 shadow-2xl">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-white flex items-center">
                <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center mr-3">
                  <Plus className="w-4 h-4 text-white" />
                </div>
                Add Money to Wallet
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              <div>
                <Label className="text-white font-medium mb-2 block">Amount (₹)</Label>
                <Input
                  type="number"
                  value={addAmount}
                  onChange={(e) => setAddAmount(e.target.value)}
                  placeholder="Enter amount"
                  className="bg-gray-700/50 border-gray-600 text-white text-lg py-3 focus:border-green-500 focus:ring-green-500/20"
                />
              </div>
              <div className="flex gap-3">
                <Button 
                  onClick={handleAddMoneyClick} 
                  className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold py-3"
                >
                  <CreditCard className="w-5 h-5 mr-2" />
                  Proceed to Payment
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => {setShowAddMoney(false); setAddAmount('');}}
                  className="border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Enhanced QR Payment Dialog */}
        <Dialog open={showQRPayment} onOpenChange={setShowQRPayment}>
          <DialogContent className="bg-gradient-to-br from-gray-800 to-gray-900 border-purple-500/30 shadow-2xl max-w-md">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-white flex items-center">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mr-3">
                  <QrCode className="w-4 h-4 text-white" />
                </div>
                Complete Payment
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              {/* Enhanced QR Code Section */}
              <div className="text-center">
                <div className="text-white font-bold text-lg mb-4 bg-gradient-to-r from-purple-500/20 to-blue-500/20 rounded-lg p-3">
                  Amount: <span className="text-green-400">₹{addAmount}</span>
                </div>
                <div className="bg-white p-6 rounded-xl inline-block shadow-xl border-4 border-purple-500/20">
                  {activeQRCode ? (
                    <img 
                      src={activeQRCode.image_url} 
                      alt={activeQRCode.name}
                      className="w-32 h-32 object-contain"
                    />
                  ) : (
                    <QrCode className="w-32 h-32 mx-auto text-black" />
                  )}
                </div>
                <div className="flex items-center justify-center gap-3 mt-3">
                  <p className="text-gray-300 text-sm font-medium">
                    {activeQRCode ? `Scan this QR code - ${activeQRCode.name}` : 'Scan this QR code with Google Pay'}
                  </p>
                  {activeQRCode && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={downloadQRCode}
                      className="border-blue-600 text-blue-400 hover:bg-blue-600/20 h-6 px-2"
                    >
                      <Download className="w-3 h-3" />
                    </Button>
                  )}
                </div>
              </div>
              
              {/* Enhanced Payment Details Form */}
              <div className="space-y-4">
                <div>
                  <Label className="text-white font-medium mb-2 block">Name as in Payment</Label>
                  <Input
                    value={paymentDetails.name}
                    onChange={(e) => setPaymentDetails({...paymentDetails, name: e.target.value})}
                    placeholder="Enter your name"
                    className="bg-gray-700/50 border-gray-600 text-white focus:border-purple-500 focus:ring-purple-500/20"
                  />
                </div>
                <div>
                  <Label className="text-white font-medium mb-2 block">Transaction ID</Label>
                  <Input
                    value={paymentDetails.transactionId}
                    onChange={(e) => setPaymentDetails({...paymentDetails, transactionId: e.target.value})}
                    placeholder="Enter transaction ID"
                    className="bg-gray-700/50 border-gray-600 text-white focus:border-purple-500 focus:ring-purple-500/20"
                  />
                </div>
                <div>
                  <Label className="text-white font-medium mb-2 block">Mobile Number</Label>
                  <Input
                    value={paymentDetails.mobile}
                    onChange={(e) => setPaymentDetails({...paymentDetails, mobile: e.target.value})}
                    placeholder="Enter mobile number"
                    className="bg-gray-700/50 border-gray-600 text-white focus:border-purple-500 focus:ring-purple-500/20"
                  />
                </div>
              </div>
              
              <div className="flex gap-3">
                <Button 
                  onClick={handleQRPaymentSubmit} 
                  className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold"
                >
                  <CheckCircle className="w-5 h-5 mr-2" />
                  Submit Payment
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setShowQRPayment(false)}
                  className="border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Enhanced Withdraw Dialog */}
        <Dialog open={showWithdraw} onOpenChange={setShowWithdraw}>
          <DialogContent className="bg-gradient-to-br from-gray-800 to-gray-900 border-orange-500/30 shadow-2xl">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-white flex items-center">
                <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-orange-600 rounded-lg flex items-center justify-center mr-3">
                  <Minus className="w-4 h-4 text-white" />
                </div>
                Withdraw Funds
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              <div>
                <Label className="text-white font-medium mb-2 block">Amount (₹) - Max: ₹{balance?.available_balance || 0}</Label>
                <Input
                  type="number"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  placeholder="Enter amount"
                  max={balance?.available_balance || 0}
                  className="bg-gray-700/50 border-gray-600 text-white text-lg py-3 focus:border-red-500 focus:ring-red-500/20"
                />
              </div>
              <div>
                <Label className="text-white font-medium mb-2 block">UPI ID</Label>
                <Input
                  value={withdrawDetails.upiId}
                  onChange={(e) => setWithdrawDetails({...withdrawDetails, upiId: e.target.value})}
                  placeholder="Enter your UPI ID"
                  className="bg-gray-700/50 border-gray-600 text-white focus:border-red-500 focus:ring-red-500/20"
                />
              </div>
              <div>
                <Label className="text-white font-medium mb-2 block">Name</Label>
                <Input
                  value={withdrawDetails.name}
                  onChange={(e) => setWithdrawDetails({...withdrawDetails, name: e.target.value})}
                  placeholder="Enter your name"
                  className="bg-gray-700/50 border-gray-600 text-white focus:border-red-500 focus:ring-red-500/20"
                />
              </div>
              <div>
                <Label className="text-white font-medium mb-2 block">Mobile Number</Label>
                <Input
                  value={withdrawDetails.mobile}
                  onChange={(e) => setWithdrawDetails({...withdrawDetails, mobile: e.target.value})}
                  placeholder="Enter your mobile number"
                  className="bg-gray-700/50 border-gray-600 text-white focus:border-red-500 focus:ring-red-500/20"
                />
              </div>
              <div className="flex gap-3">
                <Button 
                  onClick={handleWithdraw} 
                  className="flex-1 bg-gradient-to-r from-red-500 to-orange-600 hover:from-red-600 hover:to-orange-700 text-white font-bold py-3"
                >
                  <Minus className="w-5 h-5 mr-2" />
                  Submit Withdrawal Request
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => {setShowWithdraw(false); setWithdrawAmount(''); setWithdrawDetails({ upiId: '', name: '', mobile: '' });}}
                  className="border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
        </div>
      </div>
    </Layout>
  );
};

export default Wallet;