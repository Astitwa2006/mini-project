import { useState } from 'react';
import { supabase } from '../../services/supabaseClient';
import Button from '../ui/Button';

export default function GoogleLoginButton() {
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/lobby`,
        },
      });
      if (error) throw error;
    } catch (error) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant="secondary"
      size="lg"
      onClick={handleLogin}
      loading={loading}
      className="w-full relative overflow-hidden group"
    >
      <div className="absolute inset-0 bg-gradient-to-r from-violet-600/20 to-fuchsia-600/20 opacity-0 group-hover:opacity-100 transition-opacity" />
      <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5 mr-2" />
      Continue with Google
    </Button>
  );
}
