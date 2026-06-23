import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';

interface SidebarContextValue {
  isCollapsed: boolean;
  toggleSidebar: () => void;
  setCollapsed: (collapsed: boolean) => void;
}

const SidebarContext = createContext<SidebarContextValue | null>(null);

const STORAGE_KEY = '@reporting_system:sidebar_collapsed';

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    // Load persisted state
    AsyncStorage.getItem(STORAGE_KEY).then((value) => {
      if (value !== null) {
        setIsCollapsed(value === 'true');
      }
    });
  }, []);

  const toggleSidebar = () => {
    setIsCollapsed((prev) => {
      const newValue = !prev;
      AsyncStorage.setItem(STORAGE_KEY, String(newValue));
      return newValue;
    });
  };

  const setCollapsed = (collapsed: boolean) => {
    setIsCollapsed(collapsed);
    AsyncStorage.setItem(STORAGE_KEY, String(collapsed));
  };

  return (
    <SidebarContext.Provider value={{ isCollapsed, toggleSidebar, setCollapsed }}>
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (!context) {
    // Fallback to default state to avoid crashes during SSR/pre-rendering
    return {
      isCollapsed: false,
      toggleSidebar: () => {},
      setCollapsed: () => {}
    };
  }
  return context;
}

