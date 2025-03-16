import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/hooks/use-auth";
import { QueryClientProvider } from "@tanstack/react-query";
import { Route, BrowserRouter as Router, Routes, Navigate } from "react-router-dom";
import { queryClient } from "./lib/queryClient";
import { User } from "./types";

import AdminDashboard from "@/pages/admin/dashboard";
import AdminSettings from "@/pages/admin/settings";
import AdminTransactions from "@/pages/admin/transactions";
import AuthPage from "@/pages/auth-page";
import CopyTrading from "@/pages/copy-trading";
import Home from "@/pages/home"; // Import Home component
import Investments from "@/pages/investments";
import Market from "@/pages/market";
import NotFound from "@/pages/not-found";
import Profile from "@/pages/profile";
import WalletPage from "@/pages/wallet";

import React, { ComponentType } from 'react';
import { useAuth } from '@/hooks/use-auth';

interface ProtectedRouteProps {
  path: string;
  component: ComponentType<any>;
  requireAdmin?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ component: Component, requireAdmin, ...rest }) => {
  const { isAuthenticated, isAdmin } = useAuth();

  return (
    <Route
      {...rest}
      render={(props) =>
        isAuthenticated && (!requireAdmin || isAdmin) ? (
          <Component {...props} />
        ) : (
          <Navigate to="/auth" />
        )
      }
    />
  );
};

export interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAdmin: boolean;
  isAuthenticated: boolean; // Add this line
}

function App() {
  const { isAuthenticated, isAdmin } = useAuth();

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <Routes>
            <Route
              path="/admin/dashboard"
              element={
                isAuthenticated && isAdmin ? (
                  <AdminDashboard />
                ) : (
                  <Navigate to="/login" />
                )
              }
            />
            <Route
              path="/admin/transactions"
              element={
                isAuthenticated && isAdmin ? (
                  <AdminTransactions />
                ) : (
                  <Navigate to="/login" />
                )
              }
            />
            <Route
              path="/admin/settings"
              element={
                isAuthenticated && isAdmin ? (
                  <AdminSettings />
                ) : (
                  <Navigate to="/login" />
                )
              }
            />
            <Route path="/" element={<AuthPage />} />
            <Route path="/market" element={<ProtectedRoute path="/market" component={Market} />} />
            <Route path="/copy-trading" element={<ProtectedRoute path="/copy-trading" component={CopyTrading} />} />
            <Route path="/investments" element={<ProtectedRoute path="/investments" component={Investments} />} />
            <Route path="/profile" element={<ProtectedRoute path="/profile" component={Profile} />} />
            <Route path="/wallet" element={<ProtectedRoute path="/wallet" component={WalletPage} />} />
            <Route path="/admin/transactions" element={<ProtectedRoute path="/admin/transactions" component={AdminTransactions} />} />
            <Route path="/admin/settings" element={<ProtectedRoute path="/admin/settings" component={AdminSettings} />} />
            <Route path="/admin/dashboard" element={<ProtectedRoute path="/admin/dashboard" component={AdminDashboard} />} />
            <Route path="/admin/transactions" element={<ProtectedRoute path="/admin/transactions" component={AdminTransactions} />} />
            <Route path="/admin/settings" element={<ProtectedRoute path="/admin/settings" component={AdminSettings} />} />
            <Route path="/" element={<AuthPage />} /> {/* Use AuthPage for the root route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          <Toaster />
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;