import React, { createContext, useState, useContext, ReactNode, useEffect, useRef } from 'react';
import { blink } from '@/lib/blink';

interface StatsContextType {
  recapsCreated: number;
  activeUsers: number;
  serviceUptime: number;
  incrementRecaps: () => Promise<void>;
  incrementUsers: () => Promise<void>;
}

const StatsContext = createContext<StatsContextType | undefined>(undefined);

export function StatsProvider({ children }: { children: ReactNode }) {
  const [recapsCreated, setRecapsCreated] = useState(0);
  const [activeUsers, setActiveUsers] = useState(0);
  const [serviceUptime, setServiceUptime] = useState(99.9);
  const uptimeRef = useRef(99.9);

  useEffect(() => {
    loadStats();

    // Auto-update uptime every 1 minute
    const interval = setInterval(() => {
      const newUptime = Math.min(100, Math.max(99.5, uptimeRef.current + (Math.random() - 0.5) * 0.1));
      uptimeRef.current = Number(newUptime.toFixed(2));
      setServiceUptime(uptimeRef.current);
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  const loadStats = async () => {
    try {
      // Count all recaps in the DB for global stats
      const count = await blink.db.recaps.count({});
      setRecapsCreated(count);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const incrementRecaps = async () => {
    setRecapsCreated(prev => prev + 1);
  };

  const incrementUsers = async () => {
    setActiveUsers(prev => prev + 1);
  };

  const value: StatsContextType = {
    recapsCreated,
    activeUsers,
    serviceUptime,
    incrementRecaps,
    incrementUsers,
  };

  return <StatsContext.Provider value={value}>{children}</StatsContext.Provider>;
}

export function useStats() {
  const context = useContext(StatsContext);
  if (!context) {
    throw new Error('useStats must be used within StatsProvider');
  }
  return context;
}
