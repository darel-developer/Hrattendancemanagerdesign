import React, { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { Employee, Company } from "../data/mockData";
import { employeesApi, authApi, companiesApi, devicesApi, setAuthToken } from "../services/api";
import { getDeviceId, getDeviceName } from "../utils/deviceId";
import { useFcm } from "../hooks/useFcm";

export type LoginResult = true | "device_conflict" | "device_new" | false;

interface AuthContextType {
  currentUser: Employee | null;
  currentCompany: Company | null;
  login: (email: string, password: string) => Promise<LoginResult>;
  logout: () => void;
  isAuthenticated: boolean;
  loading: boolean;
  employees: Employee[];
  addEmployee: (emp: Employee & { password?: string; pin?: string }) => Promise<void>;
  updateEmployee: (id: string, updates: Partial<Employee> & { password?: string }) => Promise<void>;
  deleteEmployee: (id: string) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  refreshCompany: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const SESSION_KEY = "hr_session";
const TOKEN_KEY = "hr_token";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [currentUser, setCurrentUser] = useState<Employee | null>(null);
  const [currentCompany, setCurrentCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const isAuthenticated = !!currentUser;
  useFcm(isAuthenticated);

  // Restore session from localStorage on mount
  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    const saved = localStorage.getItem(SESSION_KEY);
    if (token && saved) {
      setAuthToken(token);
      try {
        const { userId, companyId } = JSON.parse(saved);
        Promise.all([
          employeesApi.getAll({ companyId }),
          companiesApi.getById(companyId),
        ])
          .then(([emps, company]) => {
            setEmployees(emps);
            setCurrentCompany(company);
            setCurrentUser(emps.find((e) => e.id === userId) ?? null);
          })
          .catch(() => {
            localStorage.removeItem(SESSION_KEY);
            localStorage.removeItem(TOKEN_KEY);
            setAuthToken(null);
          })
          .finally(() => setLoading(false));
      } catch {
        localStorage.removeItem(SESSION_KEY);
        localStorage.removeItem(TOKEN_KEY);
        setAuthToken(null);
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  }, []);

  // Listen for session expiry dispatched by api.ts on 401
  useEffect(() => {
    const handleExpired = () => logout();
    window.addEventListener("auth:expired", handleExpired);
    return () => window.removeEventListener("auth:expired", handleExpired);
  }, []);

  const login = async (email: string, password: string): Promise<LoginResult> => {
    try {
      const { token, user } = await authApi.login(email, password);
      setAuthToken(token);
      localStorage.setItem(TOKEN_KEY, token);
      const companyId = user.companyId!;
      const [emps, company] = await Promise.all([
        employeesApi.getAll({ companyId }),
        companiesApi.getById(companyId),
      ]);

      // Register this device for the logged-in user
      try {
        await devicesApi.register(getDeviceId(), getDeviceName());
      } catch (devErr: unknown) {
        const msg = devErr instanceof Error ? devErr.message : "";
        // Device belongs to another account — block access
        if (msg.includes("autre compte") || msg.includes("conflict")) {
          setAuthToken(null);
          localStorage.removeItem(TOKEN_KEY);
          return "device_conflict";
        }
        // Employee has a different device registered — block until admin resets
        if (msg.includes("déjà un appareil") || msg.includes("newDevice")) {
          setAuthToken(null);
          localStorage.removeItem(TOKEN_KEY);
          return "device_new";
        }
        // Other device errors are non-blocking (network issue etc.)
      }

      setCurrentUser(user);
      setEmployees(emps);
      setCurrentCompany(company);
      localStorage.setItem(SESSION_KEY, JSON.stringify({ userId: user.id, companyId }));
      return true;
    } catch {
      return false;
    }
  };

  const logout = () => {
    setCurrentUser(null);
    setEmployees([]);
    setCurrentCompany(null);
    setAuthToken(null);
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(TOKEN_KEY);
  };

  const addEmployee = async (emp: Employee & { password?: string; pin?: string }): Promise<void> => {
    const withCompany = { ...emp, companyId: emp.companyId || currentUser?.companyId || "COMP001" };
    const created = await employeesApi.create(withCompany);
    setEmployees((prev) => [...prev, created]);
  };

  const updateEmployee = async (id: string, updates: Partial<Employee> & { password?: string }): Promise<void> => {
    const emp = employees.find((e) => e.id === id);
    if (!emp) return;
    const updated = await employeesApi.update(id, { ...emp, ...updates });
    setEmployees((prev) => prev.map((e) => (e.id === id ? updated : e)));
    if (currentUser?.id === id) setCurrentUser(updated);
  };

  const deleteEmployee = async (id: string): Promise<void> => {
    await employeesApi.delete(id);
    setEmployees((prev) => prev.filter((e) => e.id !== id));
  };

  const changePassword = async (currentPassword: string, newPassword: string): Promise<void> => {
    if (!currentUser) throw new Error("Non connecté");
    await authApi.changePassword(currentUser.id, currentPassword, newPassword);
  };

  const refreshCompany = async (): Promise<void> => {
    if (!currentUser?.companyId) return;
    const company = await companiesApi.getById(currentUser.companyId);
    setCurrentCompany(company);
  };

  return (
    <AuthContext.Provider value={{
      currentUser, currentCompany, login, logout,
      isAuthenticated, loading,
      employees, addEmployee, updateEmployee, deleteEmployee,
      changePassword, refreshCompany,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
