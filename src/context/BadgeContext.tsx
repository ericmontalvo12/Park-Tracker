import React, { createContext, useCallback, useContext, useState } from 'react';
import { BadgeDefinition } from '../constants/badges';
import { BadgeToast } from '../components/BadgeToast';

interface BadgeContextValue {
  notify: (badges: BadgeDefinition[]) => void;
}

const BadgeContext = createContext<BadgeContextValue>({ notify: () => {} });

export function useBadgeNotifier() {
  return useContext(BadgeContext);
}

export function BadgeProvider({ children }: { children: React.ReactNode }) {
  const [queue, setQueue] = useState<BadgeDefinition[]>([]);

  const notify = useCallback((badges: BadgeDefinition[]) => {
    setQueue(prev => [...prev, ...badges]);
  }, []);

  const dismissFirst = useCallback(() => {
    setQueue(prev => prev.slice(1));
  }, []);

  return (
    <BadgeContext.Provider value={{ notify }}>
      {children}
      {queue.length > 0 && (
        <BadgeToast key={queue[0].id} badge={queue[0]} onDismiss={dismissFirst} />
      )}
    </BadgeContext.Provider>
  );
}
