import React, { useState } from 'react';
import { BrandingSection } from './BrandingSection';
import { LoginForm } from './LoginForm';
import { ForgotPasswordModal } from './ForgotPasswordModal';
import { User } from '../../types/auth';

interface LoginPageProps {
  onLoginSuccess: (user: User) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');

  const handleOpenForgotPassword = (email: string) => {
    setForgotPasswordEmail(email);
    setIsForgotPasswordOpen(true);
  };

  const handleCloseForgotPassword = () => {
    setIsForgotPasswordOpen(false);
  };

  return (
    <main
      className="min-h-screen w-full flex flex-col lg:flex-row bg-[#0a0a0b] text-slate-100 selection:bg-indigo-500 selection:text-white"
      id="alfa-digi-login-page"
    >
      {/* Left Section: Enterprise Visual & Branding (Desktop/Tablet) */}
      <BrandingSection />

      {/* Right Section: Centered Login Form Area */}
      <section
        className="w-full lg:w-1/2 xl:w-5/12 flex-1 flex flex-col justify-center items-center p-6 sm:p-10 lg:p-14 overflow-y-auto bg-[#0a0a0b] relative"
        aria-label="Account Login Area"
        id="login-section"
      >
        <div className="w-full max-w-md my-auto">
          <LoginForm
            onLoginSuccess={onLoginSuccess}
            onOpenForgotPassword={handleOpenForgotPassword}
          />
        </div>
      </section>

      {/* Forgot Password Modal */}
      <ForgotPasswordModal
        isOpen={isForgotPasswordOpen}
        onClose={handleCloseForgotPassword}
        initialEmail={forgotPasswordEmail}
      />
    </main>
  );
};

