// @ts-nocheck
import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { ts } from '../utils/helper';
import { ensureWalletExists, fetchWalletBalance } from '../services/betService';

const SessionContext = createContext(null);

export function SessionProvider({ children }) {
  const [user, setUser] = useState<any>(null);
  const [sessionId, setSessionId] = useState<string | undefined>(undefined);
  const [history, setHistory] = useState([]);
  const [activeBets, setActiveBets] = useState([]);
  const [duoBets, setDuoBets] = useState([]);
  const [pot, setPot] = useState({ in: 0, skill: 0, filet: 0, paid: 0 });
  const [walletBalance, setWalletBalance] = useState<number | null>(null);

  // Charge l'utilisateur depuis AsyncStorage si disponible
  useEffect(() => {
    const loadUser = async () => {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      const stored = await AsyncStorage.getItem('skillz_user');
      if (stored) {
        const parsed = JSON.parse(stored);
        setUser(parsed);
      }
    };
    loadUser();
  }, []);

  // Charge le wallet lorsque l'utilisateur est disponible
  useEffect(() => {
    if (user?.id) {
      ensureWalletExists(user.id).then(() => {
        fetchWalletBalance(user.id).then((balance) => {
          setWalletBalance(balance);
        });
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
    setActiveBets((prev) => [...prev, newBet]);
  }, []);

  const addDuoToQueue = useCallback((config) => {
  const newDuo = {
    id: Date.now(),
    player1: config.player1,
    game: config.gameKey,
    defi: config.defi,
    mise: config.mise,
    cote: 2,
    ts: ts(),
    status: 'open',
    mode: 'duo',
    duelType: config.duelType,
    handicap: config.handicap,
    drawRule: config.drawRule,
    player1Validated: false,
    player2Validated: false,
    player1Result: null,
    player2Result: null,
    joinedAt: null,
  };
  setDuoBets((prev) => [...prev, newDuo]);
}, []);

  const playBet = useCallback((bet) => {
    setActiveBets((prev) => prev.filter((b) => b.id !== bet.id));
  }, []);

  const addToHistory = useCallback((bet) => {
    setHistory((prev) => [bet, ...prev]);
    // Mettre à jour le pot local (optionnel)
    setPot((prev) => ({
      ...prev,
      in: prev.in + bet.mise,
      skill: bet.outcome === 'win' ? prev.skill : prev.skill + (bet.mise - (bet.filet || 0)),
      paid: bet.outcome === 'win' ? prev.paid + (bet.gain || 0) : prev.paid,
      filet: bet.outcome !== 'win' ? prev.filet + (bet.filet || 0) : prev.filet,
    }));
  }, []);

  const value = {
    user,
    sessionId,
    setSessionId,
    walletBalance,
    setWalletBalance,
    history,
    activeBets,
    duoBets,
    pot,
    addToQueue,
    playBet,
    addToHistory,
  };

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
}