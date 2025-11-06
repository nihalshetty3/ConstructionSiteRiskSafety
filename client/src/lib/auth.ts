import { useState, useEffect } from "react";
import { axiosInstance } from "./axios";

// In-memory access token storage
let accessToken: string | null = null;

export const getAccessToken = (): string | null => {
  return accessToken;
};

export const setAccessToken = (token: string | null): void => {
  accessToken = token;
};

export const clearAccessToken = (): void => {
  accessToken = null;
};

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: "ADMIN" | "SAFETY_OFFICER" | "SUPERVISOR" | "VIEWER";
  emailVerified: boolean;
}

interface AuthState {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
}

export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    loading: true,
    isAuthenticated: false,
  });

  const fetchMe = async () => {
    try {
      const response = await axiosInstance.get("/auth/me");
      const user = response.data;
      setAuthState({
        user,
        loading: false,
        isAuthenticated: true,
      });
      return user;
    } catch (error) {
      setAuthState({
        user: null,
        loading: false,
        isAuthenticated: false,
      });
      clearAccessToken();
      throw error;
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await axiosInstance.post("/auth/login", {
        email,
        password,
      });
      const { accessToken: token, user } = response.data;
      setAccessToken(token);
      setAuthState({
        user,
        loading: false,
        isAuthenticated: true,
      });
      return { user, accessToken: token };
    } catch (error: any) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      await axiosInstance.post("/auth/logout");
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      clearAccessToken();
      setAuthState({
        user: null,
        loading: false,
        isAuthenticated: false,
      });
    }
  };

  useEffect(() => {
    // Check if user is already authenticated on mount
    const token = getAccessToken();
    if (token) {
      fetchMe().catch(() => {
        // If fetchMe fails, user is not authenticated
        setAuthState({
          user: null,
          loading: false,
          isAuthenticated: false,
        });
      });
    } else {
      setAuthState({
        user: null,
        loading: false,
        isAuthenticated: false,
      });
    }
  }, []);

  return {
    ...authState,
    login,
    logout,
    fetchMe,
  };
};

