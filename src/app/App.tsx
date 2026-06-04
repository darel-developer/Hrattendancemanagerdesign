import React from "react";
import { RouterProvider } from "react-router";
import { router } from "./routes";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import { NotificationPrompt } from "./components/NotificationPrompt";

function AppContent() {
  const { notifPermission, requestNotifPermission, isAuthenticated } = useAuth();
  return (
    <>
      <RouterProvider router={router} />
      {isAuthenticated && (
        <NotificationPrompt
          permission={notifPermission}
          onRequest={requestNotifPermission}
        />
      )}
    </>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}