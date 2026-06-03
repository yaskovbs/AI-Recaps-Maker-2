import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { blink } from '@/lib/blink';
import { useAuth } from './AuthContext';

interface CreditsHistory {
  type: 'earned' | 'consumed';
  amount: number;
  timestamp: number;
  reason: string;
}

interface CreditsContextType {
  balance: number;
  isLoading: boolean;
  history: CreditsHistory[];
  earnCreditFromAd: () => Promise<boolean>;
  consumeForRecap: () => Promise<boolean>;
  consumeForChannelSlot: (adsRequired: number) => Promise<boolean>;
  hasEnoughCredits: (amount: number) => boolean;
  refresh: () => Promise<void>;
}

const CreditsContext = createContext<CreditsContextType | undefined>(undefined);

export function CreditsProvider({ children }: { children: ReactNode }) {
  const [balance, setBalance] = useState(0);
  const [history, setHistory] = useState<CreditsHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (user && !user.id.startsWith('guest_')) {
      loadData();
    } else {
      setBalance(0);
      setHistory([]);
      setIsLoading(false);
    }
  }, [user]);

  const loadData = async () => {
    if (!user) return;
    try {
      setIsLoading(true);
      // Load balance
      const credits = await blink.db.userCredits.list({ where: { userId: user.id }, limit: 1 });
      if (credits.length > 0) {
        setBalance(Number((credits[0] as any).balance) || 0);
      } else {
        // Create initial record
        await blink.db.userCredits.create({ userId: user.id, balance: 0 });
        setBalance(0);
      }

      // Load history
      const hist = await blink.db.creditsHistory.list({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
        limit: 50,
      });
      setHistory(hist.map((h: any) => ({
        type: h.type,
        amount: Number(h.amount),
        timestamp: new Date(h.createdAt).getTime(),
        reason: h.reason,
      })));
    } catch (error) {
      console.error('Failed to load credits data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateBalance = async (newBalance: number) => {
    if (!user) return;
    const credits = await blink.db.userCredits.list({ where: { userId: user.id }, limit: 1 });
    if (credits.length > 0) {
      await blink.db.userCredits.update((credits[0] as any).id, {
        balance: newBalance,
        updatedAt: new Date().toISOString(),
      });
    }
    setBalance(newBalance);
  };

  const addHistory = async (type: 'earned' | 'consumed', amount: number, reason: string) => {
    if (!user) return;
    await blink.db.creditsHistory.create({
      userId: user.id,
      type,
      amount,
      reason,
      createdAt: new Date().toISOString(),
    });
    const newEntry: CreditsHistory = { type, amount, timestamp: Date.now(), reason };
    setHistory(prev => [newEntry, ...prev].slice(0, 50));
  };

  const earnCreditFromAd = async (): Promise<boolean> => {
    try {
      const newBalance = balance + 1;
      await updateBalance(newBalance);
      await addHistory('earned', 1, 'Watched rewarded ad');
      return true;
    } catch (error) {
      console.error('Failed to earn credit:', error);
      return false;
    }
  };

  const consumeForRecap = async (): Promise<boolean> => {
    if (balance < 1) return false;
    try {
      const newBalance = balance - 1;
      await updateBalance(newBalance);
      await addHistory('consumed', 1, 'Created recap');
      return true;
    } catch (error) {
      console.error('Failed to consume credit:', error);
      return false;
    }
  };

  const consumeForChannelSlot = async (adsRequired: number): Promise<boolean> => {
    if (balance < adsRequired) return false;
    try {
      const newBalance = balance - adsRequired;
      await updateBalance(newBalance);
      await addHistory('consumed', adsRequired, 'Unlocked YouTube channel slot');
      return true;
    } catch (error) {
      console.error('Failed to consume credits:', error);
      return false;
    }
  };

  const hasEnoughCredits = (amount: number) => balance >= amount;
  const refresh = async () => loadData();

  const value: CreditsContextType = {
    balance,
    isLoading,
    history,
    earnCreditFromAd,
    consumeForRecap,
    consumeForChannelSlot,
    hasEnoughCredits,
    refresh,
  };

  return <CreditsContext.Provider value={value}>{children}</CreditsContext.Provider>;
}

export function useCredits() {
  const context = useContext(CreditsContext);
  if (!context) throw new Error('useCredits must be used within CreditsProvider');
  return context;
}
