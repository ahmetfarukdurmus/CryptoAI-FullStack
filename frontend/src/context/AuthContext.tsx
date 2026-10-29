import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserDto, RegisterResponseDto } from '../services/api/types';
import { cryptoService, API_BASE_URL } from '../services/api/cryptoService';

const SESSION_DURATION_DAYS = 30;
const SESSION_DURATION_MS = SESSION_DURATION_DAYS * 24 * 60 * 60 * 1000;
const STORAGE_KEY = '@cryptoai_auth_user';

interface StoredSession {
  user: UserDto;
  token: string;
  sessionExpiresAt: number;
}

interface AuthContextType {
  user: UserDto | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;
  sessionDaysRemaining: number;
  sessionExpiryDate: string;
  login: (email: string, pass: string) => Promise<void>;
  register: (fName: string, lName: string, email: string, pass: string) => Promise<RegisterResponseDto>;
  verifyOtp: (email: string, code: string) => Promise<void>;
  resendOtp: (email: string) => Promise<boolean>;
  updateUserProfile: (fName: string, lName: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserDto | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const [sessionExpiresAt, setSessionExpiresAt] = useState<number>(
    Date.now() + SESSION_DURATION_MS
  );

  const logout = useCallback(async () => {
    setUser(null);
    setToken(null);
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
    } catch {
      // sessiz
    }
  }, []);

  const loadStoredSession = useCallback(async () => {
    try {
      const storedStr = await AsyncStorage.getItem(STORAGE_KEY);
      if (!storedStr) {
        // Kesinlikle kayıtlı bir oturum yok, doğrudan giriş ekranına yönlendir
        setUser(null);
        setToken(null);
        setIsInitialized(true);
        setIsLoading(false);
        return;
      }

      const stored: StoredSession = JSON.parse(storedStr);

      // Token veya kullanıcı verisi yoksa veya süre dolmuşsa temizle
      if (!stored || !stored.token || (stored.sessionExpiresAt && Date.now() > stored.sessionExpiresAt)) {
        await logout();
        setIsInitialized(true);
        setIsLoading(false);
        return;
      }

      // Sahte/mock tokenları kesinlikle reddet
      if (stored.token === 'jwt_mock_token' || !stored.token.includes('.')) {
        await logout();
        setIsInitialized(true);
        setIsLoading(false);
        return;
      }

      // Token'ı backend /api/v1/auth/me rotasından doğrula (3 sn timeout)
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);

        const response = await fetch(`${API_BASE_URL}/v1/auth/me`, {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${stored.token}`,
          },
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        if (response.ok) {
          const verifiedUser: UserDto = await response.json();
          setUser(verifiedUser);
          setToken(stored.token);
          if (stored.sessionExpiresAt) {
            setSessionExpiresAt(stored.sessionExpiresAt);
          }
        } else if (response.status === 401 || response.status === 404) {
          await logout();
        } else {
          setUser(stored.user);
          setToken(stored.token);
        }
      } catch {
        // Backend'e ulaşılamadıysa veya zaman aşımına uğradıysa yerel oturumla devam et
        setUser(stored.user);
        setToken(stored.token);
        if (stored.sessionExpiresAt) {
          setSessionExpiresAt(stored.sessionExpiresAt);
        }
      }
    } catch {
      await logout();
    } finally {
      setIsInitialized(true);
      setIsLoading(false);
    }
  }, [logout]);

  useEffect(() => {
    // 401 yetkilendirme hatası alındığında otomatik çıkış yap
    cryptoService.setOnUnauthorized(() => {
      logout();
    });

    loadStoredSession();
  }, [loadStoredSession, logout]);

  const calculateDaysRemaining = (expiryTime: number) => {
    const diff = expiryTime - Date.now();
    if (diff <= 0) return 0;
    return Math.max(1, Math.ceil(diff / (24 * 60 * 60 * 1000)));
  };

  const saveSession = async (userData: UserDto, jwtToken: string, expiryTime: number) => {
    setUser(userData);
    setToken(jwtToken);
    setSessionExpiresAt(expiryTime);
    const sessionData: StoredSession = {
      user: userData,
      token: jwtToken,
      sessionExpiresAt: expiryTime,
    };
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(sessionData));
  };

  const login = async (email: string, pass: string) => {
    setIsLoading(true);
    try {
      const res = await cryptoService.login(email, pass);
      const expiry = Date.now() + SESSION_DURATION_MS;
      await saveSession(res.user, res.token, expiry);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (
    fName: string,
    lName: string,
    email: string,
    pass: string
  ): Promise<RegisterResponseDto> => {
    setIsLoading(true);
    try {
      const res = await cryptoService.register(fName, lName, email, pass);
      if (res && res.token && res.user) {
        const expiry = Date.now() + SESSION_DURATION_MS;
        await saveSession(res.user, res.token, expiry);
      }
      return res;
    } finally {
      setIsLoading(false);
    }
  };

  const verifyOtp = async (email: string, code: string) => {
    setIsLoading(true);
    try {
      const res = await cryptoService.verifyCode(email, code);
      const expiry = Date.now() + SESSION_DURATION_MS;
      await saveSession(res.user, res.token, expiry);
    } finally {
      setIsLoading(false);
    }
  };

  const resendOtp = async (email: string): Promise<boolean> => {
    return await cryptoService.resendCode(email);
  };

  const refreshSession = async () => {
    if (user && token) {
      const newExpiry = Date.now() + SESSION_DURATION_MS;
      await saveSession(user, token, newExpiry);
    }
  };

  const updateUserProfile = async (fName: string, lName: string) => {
    if (user && token) {
      const updatedUser: UserDto = {
        ...user,
        firstName: fName.trim(),
        lastName: lName.trim(),
      };
      await saveSession(updatedUser, token, sessionExpiresAt);
    }
  };

  const daysRemaining = calculateDaysRemaining(sessionExpiresAt);
  const formattedExpiryDate = new Date(sessionExpiresAt).toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user && !!token,
        isLoading,
        isInitialized,
        sessionDaysRemaining: daysRemaining,
        sessionExpiryDate: formattedExpiryDate,
        login,
        register,
        verifyOtp,
        resendOtp,
        updateUserProfile,
        logout,
        refreshSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
