import { useState, useEffect } from 'react';
import { LoginPage } from './components/login/LoginPage';
import { RoleDashboardView } from './components/dashboard/RoleDashboardView';
import { authService } from './services/authService';
import { notificationService } from './services/notificationService';
import { User } from './types/auth';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    // Restore session on initial load - but ALWAYS re-validate with the server,
    // so a deleted/deactivated account lands back on the login page.
    const restore = async () => {
      const storedUser = authService.getCurrentUser();
      if (storedUser) {
        const verified = await authService.verifySession();
        if (verified) {
          setCurrentUser(verified);
        }
      }
      setIsInitializing(false);
      // Ask for Chrome notification permission as soon as the site opens (only if not decided yet)
      notificationService.promptForPermissionIfNeeded();
    };
    void restore();
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
