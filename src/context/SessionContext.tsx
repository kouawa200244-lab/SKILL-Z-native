// @ts-nocheck
import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ts } from '../utils/helpers';
import { fetchWallet, updateBalance } from '../walletService';

const SessionContext = createContext(null);

export function SessionProvider({ children }) {
  const [user, setUser] = useState(null);
  const [history, setHistory] = useState([]);
  const [activeBets, setActiveBets] = useState([]);
  const [duoBets, setDuoBets] = useState([]);
  const [pot, setPot] = useState({ in: 0, skill: 0, filet: 0, paid: 0 });
  const [walletBalance, setWalletBalance] = useState(null);
  const [loading, setLoading] = useState(true);

  // Charger l'utilisateur depuis AsyncStorage
  useEffect(() => {
    const loadUser = async () => {
      const stored = await AsyncStorage.getItem('skillz_user');
      if (stored) {
        const parsed = JSON.parse(stored);
        setUser(parsed);
      }
      setLoading(false);
    };
    loadUser();
  }, []);

  // Charger le wallet quand l'utilisateur est disponible
  useEffect(() => {
    if (user?.id) {
      fetchWallet(user.id).then(wallet => {
        if (wallet) {
          setWalletBalance(wallet.balance);
        }
      });
    }
  }, [user]);

  const addToQueue = useCallback(({ player, mise, gameKey, defi }) => {
    const newBet = {
      id: Date.now(),
      player,
      game: gameKey,
      defi,
      mise,
      cote: defi.cote,
      ts: ts(),
      mode: 'solo',
    };
    setActiveBets(prev => [...prev, newBet]);
  }, []);

  const playBet = useCallback((bet) => {
    setActiveBets(prev => prev.filter(b => b.id !== bet.id));
  }, []);

  const addToHistory = useCallback(async (bet) => {
    setHistory(prev => [bet, ...prev]);

    // Mettre à jour le solde dans Supabase
    if (user?.id) {
      if (bet.outcome === 'win') {
        const newBalance = (walletBalance || 0) + bet.gain;
        setWalletBalance(newBalance);
        await updateBalance(user.id, newBalance);
      } else {
        const filet = bet.filet || 0;
        const newBalance = (walletBalance || 0) - (bet.mise - filet);
        setWalletBalance(newBalance);
        await updateBalance(user.id, newBalance);
      }
    }

    // Mettre à jour le pot local
    setPot(prev => ({
      ...prev,
      in: prev.in + bet.mise,
      skill: bet.outcome === 'win' ? prev.skill : prev.skill + (bet.mise - (bet.filet || 0)),
      paid: bet.outcome === 'win' ? prev.paid + bet.gain : prev.paid,
      filet: bet.outcome !== 'win' ? prev.filet + (bet.filet || 0) : prev.filet,
    }));
  }, [user, walletBalance]);

  const value = {
    user,
    history,
    activeBets,
    duoBets,
    pot,
    walletBalance,
    loading,
    addToQueue,
    playBet,
    addToHistory,
    setWalletBalance,
  };

  return (
    <SessionContext.Provider value={value}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
}