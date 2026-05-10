import { useState, useEffect, useCallback } from 'react';
import { getWallet, getTransactions, subscribeToWallet } from '../utils/walletService';

export default function useWallet(userId) {
  const [wallet,       setWallet]       = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState(null);

  const load = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    try {
      const [w, tx] = await Promise.all([
        getWallet(userId),
        getTransactions(userId),
      ]);
      setWallet(w);
      setTransactions(tx);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    load();

    // Realtime subscription
    const unsubscribe = subscribeToWallet(userId, (updatedWallet) => {
      setWallet(updatedWallet);
    });

    return unsubscribe;
  }, [userId]);

  return {
    wallet,
    transactions,
    loading,
    error,
    refresh: load,
    balance: wallet?.balance ?? 0,
  };
}