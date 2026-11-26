import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import {
  clearDemoSession,
  clearDemoStorage,
  getDemoSession,
  getDemoState,
  resetDemoState,
  saveDemoState,
  saveDemoSession,
  startDemoSession
} from './demoStorage';

const DemoContext = createContext(null);

export function DemoProvider({ children }) {
  const [session, setSession] = useState(() => getDemoSession());
  const [demoState, setDemoState] = useState(() => getDemoState());

  const beginSession = useCallback((role) => {
    const nextSession = startDemoSession(role);
    setSession(nextSession);
    return nextSession;
  }, []);

  const endSession = useCallback(() => {
    clearDemoSession();
    setSession(null);
  }, []);

  const updateDemoState = useCallback((updater) => {
    const nextState = typeof updater === 'function' ? updater(demoState) : updater;
    saveDemoState(nextState);
    setDemoState(nextState);
    return nextState;
  }, [demoState]);

  const resetWorkspace = useCallback(() => {
    clearDemoStorage();
    const nextState = resetDemoState();
    setDemoState(nextState);

    if (session) {
      const nextSession = {
        ...session,
        startedAt: new Date().toISOString()
      };
      saveDemoSession(nextSession);
      setSession(nextSession);
    }
  }, [session]);

  const value = useMemo(() => ({
    session,
    demoState,
    beginSession,
    endSession,
    updateDemoState,
    resetWorkspace
  }), [session, demoState, beginSession, endSession, updateDemoState, resetWorkspace]);

  return <DemoContext.Provider value={value}>{children}</DemoContext.Provider>;
}

export function useDemo() {
  const context = useContext(DemoContext);
  if (!context) {
    throw new Error('useDemo must be used inside DemoProvider.');
  }
  return context;
}
