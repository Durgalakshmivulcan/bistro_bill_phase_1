import React, { createContext, useContext, useEffect } from 'react';

interface ThemeContextType {
  theme: 'light';
  resolvedTheme: 'light';
  setTheme: (theme: string) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Always ensure dark class is removed
  useEffect(() => {
    document.documentElement.classList.remove('dark');
  }, []);

  const value: ThemeContextType = {
    theme: 'light',
    resolvedTheme: 'light',
    setTheme: () => {},
    toggleTheme: () => {},
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
