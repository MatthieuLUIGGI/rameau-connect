import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { logAudit } from '@/lib/auditLog';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isAG: boolean;
  signUp: (email: string, password: string, firstName: string, lastName: string, apartmentNumber: number) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAG, setIsAG] = useState(false);
  const navigate = useNavigate();

  const SESSION_MAX_AGE_MS = 15 * 60 * 1000; // 15 minutes
  const TAB_SESSION_KEY = 'tab_session_active';

  const checkSessionExpiry = async () => {
    const loginTimeStr = localStorage.getItem('login_time');
    if (!loginTimeStr) return false;
    const loginTime = parseInt(loginTimeStr, 10);
    if (isNaN(loginTime)) return false;
    if (Date.now() - loginTime > SESSION_MAX_AGE_MS) {
      localStorage.removeItem('login_time');
      await supabase.auth.signOut();
      return true;
    }
    return false;
  };

  // If sessionStorage flag is missing while a Supabase session exists,
  // it means the tab/browser was closed and reopened → force sign out.
  const checkTabClosed = async (hasSession: boolean) => {
    if (!hasSession) return false;
    const tabFlag = sessionStorage.getItem(TAB_SESSION_KEY);
    if (!tabFlag) {
      localStorage.removeItem('login_time');
      await supabase.auth.signOut();
      return true;
    }
    return false;
  };

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        // Check AG role after session update
        if (session?.user) {
          setTimeout(() => {
            checkAGRole(session.user.id);
          }, 0);
        } else {
          setIsAG(false);
        }
        
        setIsLoading(false);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session) {
        const tabClosed = await checkTabClosed(true);
        if (tabClosed) {
          setSession(null);
          setUser(null);
          setIsLoading(false);
          return;
        }
        const expired = await checkSessionExpiry();
        if (expired) {
          setSession(null);
          setUser(null);
          setIsLoading(false);
          return;
        }
      }
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        checkAGRole(session.user.id);
      }
      setIsLoading(false);
    });

    // Periodic check every 30 seconds
    const interval = setInterval(() => {
      checkSessionExpiry();
    }, 30 * 1000);

    return () => {
      subscription.unsubscribe();
      clearInterval(interval);
    };
  }, []);

  const checkAGRole = async (userId: string) => {
    const { data } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .eq('role', 'ag')
      .maybeSingle();
    
    setIsAG(!!data);
  };

  const signUp = async (email: string, password: string, firstName: string, lastName: string, apartmentNumber: number) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          first_name: firstName,
          last_name: lastName,
          apartment_number: apartmentNumber
        }
      }
    });
    
    if (!error) {
      navigate('/');
    }
    
    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (!error && data.user) {
      // Update last_sign_in_at in profiles
      await supabase
        .from('profiles')
        .update({ last_sign_in_at: new Date().toISOString() } as any)
        .eq('id', data.user.id);
      localStorage.setItem('login_time', Date.now().toString());
      sessionStorage.setItem(TAB_SESSION_KEY, '1');
      logAudit({ action: 'login', page: '/auth' });
      navigate('/');
    }
    
    return { error };
  };

  const signOut = async () => {
    await logAudit({ action: 'logout' });
    localStorage.removeItem('login_time');
    sessionStorage.removeItem(TAB_SESSION_KEY);
    await supabase.auth.signOut();
    navigate('/auth');
  };

  return (
    <AuthContext.Provider value={{ user, session, isLoading, isAG, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
