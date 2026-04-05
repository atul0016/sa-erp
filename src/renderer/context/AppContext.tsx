import React, { createContext, useContext, useReducer, ReactNode, useEffect } from 'react';

interface User {
  id: string;
  tenant_id: string;
  tenant_name: string;
  tenant_code: string;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  roles: string;
}

interface AppState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  currentModule: string;
  fiscalYear: string;
  sidebarOpen: boolean;
  theme: 'light' | 'dark';
  notifications: Array<{
    id: string;
    type: 'success' | 'error' | 'warning' | 'info';
    message: string;
  }>;
}

type AppAction =
  | { type: 'SET_USER'; payload: User }
  | { type: 'LOGOUT' }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_MODULE'; payload: string }
  | { type: 'SET_FISCAL_YEAR'; payload: string }
  | { type: 'TOGGLE_SIDEBAR' }
  | { type: 'SET_SIDEBAR'; payload: boolean }
  | { type: 'SET_THEME'; payload: 'light' | 'dark' }
  | { type: 'ADD_NOTIFICATION'; payload: { type: 'success' | 'error' | 'warning' | 'info'; message: string } }
  | { type: 'REMOVE_NOTIFICATION'; payload: string };

const initialState: AppState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
  currentModule: 'dashboard',
  fiscalYear: getCurrentFiscalYear(),
  sidebarOpen: typeof window !== 'undefined' ? window.innerWidth >= 1024 : true,
  theme: 'light',
  notifications: [],
};

function getCurrentFiscalYear(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  if (month >= 4) {
    return `${year}-${year + 1}`;
  }
  return `${year - 1}-${year}`;
}

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_USER':
      return {
        ...state,
        user: action.payload,
        isAuthenticated: true,
        isLoading: false,
      };
    case 'LOGOUT':
      localStorage.removeItem('user');
      return {
        ...state,
        user: null,
        isAuthenticated: false,
      };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_MODULE':
      return { ...state, currentModule: action.payload };
    case 'SET_FISCAL_YEAR':
      return { ...state, fiscalYear: action.payload };
    case 'TOGGLE_SIDEBAR':
      return { ...state, sidebarOpen: !state.sidebarOpen };
    case 'SET_SIDEBAR':
      return { ...state, sidebarOpen: action.payload };
    case 'SET_THEME':
      localStorage.setItem('theme', action.payload);
      return { ...state, theme: action.payload };
    case 'ADD_NOTIFICATION':
      const id = Date.now().toString();
      return {
        ...state,
        notifications: [...state.notifications, { id, ...action.payload }],
      };
    case 'REMOVE_NOTIFICATION':
      return {
        ...state,
        notifications: state.notifications.filter((n) => n.id !== action.payload),
      };
    default:
      return state;
  }
}

interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  notify: (type: 'success' | 'error' | 'warning' | 'info', message: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  useEffect(() => {
    // Check for stored user session
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        dispatch({ type: 'SET_USER', payload: user });
      } catch {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    } else if (window.electronAPI?.auth?.getCurrentUser) {
      // Try to restore Appwrite session
      window.electronAPI.auth.getCurrentUser().then((res: any) => {
        if (res?.success && res.data) {
          localStorage.setItem('user', JSON.stringify(res.data));
          dispatch({ type: 'SET_USER', payload: res.data as User });
        } else {
          dispatch({ type: 'SET_LOADING', payload: false });
        }
      }).catch(() => dispatch({ type: 'SET_LOADING', payload: false }));
    } else {
      dispatch({ type: 'SET_LOADING', payload: false });
    }

    // Check for stored theme
    const storedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    if (storedTheme) {
      dispatch({ type: 'SET_THEME', payload: storedTheme });
    }
  }, []);

  // Auto-remove notifications after 5 seconds
  useEffect(() => {
    if (state.notifications.length > 0) {
      const timer = setTimeout(() => {
        dispatch({ type: 'REMOVE_NOTIFICATION', payload: state.notifications[0].id });
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [state.notifications]);

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      const response = await window.electronAPI.auth.login(username, password);
      if (response.success && response.data) {
        const user = response.data as User;
        localStorage.setItem('user', JSON.stringify(user));
        dispatch({ type: 'SET_USER', payload: user });
        return true;
      } else {
        notify('error', response.error || 'Login failed');
        return false;
      }
    } catch (error) {
      notify('error', 'Login failed. Please try again.');
      return false;
    }
  };

  const logout = async () => {
    try {
      await window.electronAPI?.auth?.logout?.();
    } catch { /* ignore */ }
    dispatch({ type: 'LOGOUT' });
  };

  const notify = (type: 'success' | 'error' | 'warning' | 'info', message: string) => {
    dispatch({ type: 'ADD_NOTIFICATION', payload: { type, message } });
  };

  return (
    <AppContext.Provider value={{ state, dispatch, login, logout, notify }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
