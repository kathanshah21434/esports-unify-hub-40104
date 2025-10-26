import { supabase } from '@/integrations/supabase/client';

export interface WalletTransaction {
  id: string;
  user_id: string;
  transaction_type: 'deposit' | 'withdrawal';
  amount: number;
  status: 'pending' | 'approved' | 'rejected';
  payment_method?: string;
  transaction_reference?: string;
  admin_notes?: string;
  approved_by?: string;
  approved_at?: string;
  created_at: string;
  updated_at: string;
}

export interface WalletBalance {
  id: string;
  user_id: string;
  available_balance: number;
  pending_balance: number;
  total_deposited: number;
  total_withdrawn: number;
  created_at: string;
  updated_at: string;
}

export const walletService = {
  async getTransactionsWithUserInfo(): Promise<any[]> {
    // First get all transactions
    const { data: transactions, error: transError } = await supabase
      .from('wallet_transactions')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (transError) {
      console.error('Error fetching transactions:', transError);
      return [];
    }

    // Get user profiles and balances for each transaction
    const enrichedTransactions = await Promise.all(
      (transactions || []).map(async (transaction) => {
        const [profileResult, balanceResult] = await Promise.all([
          supabase
            .from('profiles')
            .select('name, email')
            .eq('user_id', transaction.user_id)
            .single(),
          supabase
            .from('wallet_balances')
            .select('available_balance')
            .eq('user_id', transaction.user_id)
            .single()
        ]);

        return {
          ...transaction,
          user_name: profileResult.data?.name || 'Unknown',
          user_email: profileResult.data?.email || 'Unknown',
          user_balance: balanceResult.data?.available_balance || 0
        };
      })
    );

    return enrichedTransactions;
  },

  async getTransactions(): Promise<WalletTransaction[]> {
    const { data, error } = await supabase
      .from('wallet_transactions')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching transactions:', error);
      return [];
    }
    return (data || []) as WalletTransaction[];
  },

  async getUserTransactions(userId: string): Promise<WalletTransaction[]> {
    const { data, error } = await supabase
      .from('wallet_transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching user transactions:', error);
      return [];
    }
    return (data || []) as WalletTransaction[];
  },

  async getUserBalance(userId: string): Promise<WalletBalance | null> {
    const { data, error } = await supabase
      .from('wallet_balances')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();
    
    if (error) {
      console.error('Error fetching user balance:', error);
      return null;
    }
    return data as WalletBalance | null;
  },

  async createTransaction(transaction: Omit<WalletTransaction, 'id' | 'created_at' | 'updated_at'>): Promise<WalletTransaction> {
    // Ensure we have a valid session so RLS (auth.uid()) passes
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session?.user) {
      throw new Error('You must be logged in to create a transaction');
    }

    // Force user_id to the authenticated user to satisfy RLS
    const safeTransaction = {
      ...transaction,
      user_id: sessionData.session.user.id,
    };

    const { data, error } = await supabase
      .from('wallet_transactions')
      .insert([safeTransaction])
      .select()
      .single();
    
    if (error) {
      console.error('Error creating transaction:', error);
      throw error;
    }
    return data as WalletTransaction;
  },

  async updateTransactionStatus(id: string, status: 'approved' | 'rejected', adminNotes?: string): Promise<WalletTransaction> {
    const { data, error } = await supabase
      .from('wallet_transactions')
      .update({
        status,
        admin_notes: adminNotes,
        approved_at: status === 'approved' ? new Date().toISOString() : null,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .maybeSingle();
    
    if (error) {
      console.error('Error updating transaction status:', error);
      throw error;
    }
    
    if (!data) {
      throw new Error('Transaction not found');
    }
    
    return data as WalletTransaction;
  },

  async payForTournament(userId: string, amount: number, tournamentId: string, tournamentName: string): Promise<boolean> {
    // Check if user has sufficient balance
    const balance = await this.getUserBalance(userId);
    if (!balance || balance.available_balance < amount) {
      throw new Error('Insufficient wallet balance');
    }

    // Create a tournament payment transaction
    const transaction = await this.createTransaction({
      user_id: userId,
      transaction_type: 'withdrawal',
      amount: amount,
      status: 'approved', // Auto-approve tournament payments
      payment_method: 'wallet',
      transaction_reference: `tournament_${tournamentId}`,
      admin_notes: `Tournament: ${tournamentName}`
    });

    return true;
  }
};