import { useState } from 'react';
import { supabase } from '../supabase';

export function useEmailAuth() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Send 6-digit OTP code to email
  const sendOtp = async (email: string) => {
    try {
      setLoading(true);
      setError(null);

      const { error: otpError } = await supabase.auth.signInWithOtp({
        email: email.trim().toLowerCase(),
        options: {
          shouldCreateUser: true,
        },
      });

      if (otpError) throw otpError;

      return { success: true, message: 'Code sent to your email' };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to send code';
      setError(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  };

  // Verify 6-digit OTP code
  const verifyOtp = async (email: string, token: string) => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: verifyError } = await supabase.auth.verifyOtp({
        email: email.trim().toLowerCase(),
        token,
        type: 'email',
      });

      if (verifyError) throw verifyError;

      return { success: true, user: data.user };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Invalid code';
      let friendlyMessage = message;
      if (message.includes('Token has expired')) {
        friendlyMessage = 'Code expired. Please request a new one.';
      } else if (message.includes('Invalid') || message.includes('invalid')) {
        friendlyMessage = 'Invalid code. Please try again.';
      }
      setError(friendlyMessage);
      return { success: false, error: friendlyMessage };
    } finally {
      setLoading(false);
    }
  };

  const clearError = () => setError(null);

  return {
    sendOtp,
    verifyOtp,
    loading,
    error,
    clearError,
  };
}
