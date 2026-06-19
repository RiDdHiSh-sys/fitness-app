import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Alert } from 'react-native';

interface UserProfile {
  user_id: string;
  name: string;
  age: number;
  weight_kg: number;
  height_cm: number;
  goal: 'lose_weight' | 'build_muscle' | 'maintain';
}

interface AppContextType {
  user: UserProfile | null;
  setUser: (u: UserProfile | null) => void;
  isLoading: boolean;
}

const AppContext = createContext<AppContextType>({
  user: null,
  setUser: () => {},
  isLoading: false,
});

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading] = useState(false);

  return (
    <AppContext.Provider value={{ user, setUser, isLoading }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => useContext(AppContext);
