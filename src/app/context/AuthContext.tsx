import React, { createContext, useContext, useState, ReactNode } from "react";
import { Employee, employees as initialEmployees } from "../data/mockData";

interface AuthContextType {
  currentUser: Employee | null;
  login: (email: string, password: string) => boolean;
  logout: () => void;
  isAuthenticated: boolean;
  employees: Employee[];
  addEmployee: (emp: Employee) => void;
  updateEmployee: (id: string, updates: Partial<Employee>) => void;
  deleteEmployee: (id: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [employees, setEmployees] = useState<Employee[]>(initialEmployees);
  const [currentUser, setCurrentUser] = useState<Employee | null>(
    initialEmployees[0] // Default admin for demo
  );

  const login = (email: string, _password: string): boolean => {
    const user = employees.find((e) => e.email.toLowerCase() === email.toLowerCase());
    if (user) {
      setCurrentUser(user);
      return true;
    }
    // Demo fallback
    setCurrentUser(employees[0]);
    return true;
  };

  const logout = () => setCurrentUser(null);

  const addEmployee = (emp: Employee) => {
    setEmployees((prev) => [...prev, emp]);
  };

  const updateEmployee = (id: string, updates: Partial<Employee>) => {
    setEmployees((prev) => prev.map((e) => (e.id === id ? { ...e, ...updates } : e)));
    // Also update currentUser if it's the same employee
    if (currentUser?.id === id) {
      setCurrentUser((prev) => prev ? { ...prev, ...updates } : prev);
    }
  };

  const deleteEmployee = (id: string) => {
    setEmployees((prev) => prev.filter((e) => e.id !== id));
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        login,
        logout,
        isAuthenticated: !!currentUser,
        employees,
        addEmployee,
        updateEmployee,
        deleteEmployee,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
