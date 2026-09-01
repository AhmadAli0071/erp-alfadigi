import { useState, useEffect } from 'react';
import { LoginPage } from './components/login/LoginPage';
import { RoleDashboardView } from './components/dashboard/RoleDashboardView';
import { authService } from './services/authService';
import { User } from './types/auth';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    // Restore session on initial load if remembered/active
    const user = authService.getCurrentUser();
    if (user) {
      setCurrentUser(user);
    }
    setIsInitializing(false);
  }, []);

  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
  };

  const handleLogout = async () => {
    await authService.logout();
    setCurrentUser(null);
  };

  if (isInitializing) {
    return (
      <div className="min-h-screen w-full bg-[#F7F9FC] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (currentUser) {
    return <RoleDashboardView user={currentUser} onLogout={handleLogout} />;
  }

  return <LoginPage onLoginSuccess={handleLoginSuccess} />;
}
