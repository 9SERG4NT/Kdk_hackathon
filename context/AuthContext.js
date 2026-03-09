import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

// Hardcoded credentials
const ADMIN_EMAIL = 'admin';
const ADMIN_PASS = '123';
const NMC_EMAIL = 'nmc';
const NMC_PASS = '123';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isGuest, setIsGuest] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchProfile(session.user.id, session.user);
      else setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setUser(session?.user ?? null);
        if (session?.user) {
          setIsGuest(false);
          await fetchProfile(session.user.id, session.user);
        } else {
          setProfile(null);
          setLoading(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId, authUser) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error && error.code === 'PGRST116') {
        console.log('No profile found, creating one...');
        const fullName = authUser?.user_metadata?.full_name || authUser?.email?.split('@')[0] || 'User';
        const newProfile = {
          id: userId,
          full_name: fullName,
          role: 'citizen',
          karma_points: 0,
          total_reports: 0,
          badge_level: 'newcomer',
        };

        const { data: created, error: createErr } = await supabase
          .from('profiles')
          .upsert(newProfile)
          .select()
          .single();

        if (createErr) {
          console.error('Failed to create profile:', createErr.message);
          setProfile(newProfile);
        } else {
          setProfile(created);
        }
      } else if (error) {
        console.error('Error fetching profile:', error.message);
        setProfile({
          id: userId,
          full_name: authUser?.user_metadata?.full_name || 'User',
          role: 'citizen',
          karma_points: 0,
          total_reports: 0,
          badge_level: 'newcomer',
        });
      } else {
        setProfile(data);
      }
    } catch (err) {
      console.error('Profile fetch exception:', err.message);
      setProfile({
        id: userId,
        full_name: 'User',
        role: 'citizen',
        karma_points: 0,
        total_reports: 0,
        badge_level: 'newcomer',
      });
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email, password, fullName) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });
    return { data, error };
  };

  const signIn = async (email, password) => {
    // Check for hardcoded admin credentials
    if (email === ADMIN_EMAIL && password === ADMIN_PASS) {
      const adminProfile = {
        id: 'admin-local',
        full_name: 'Admin',
        role: 'admin',
        karma_points: 0,
        total_reports: 0,
        badge_level: 'platinum',
      };
      setUser({ id: 'admin-local', email: 'admin@civicfix.local' });
      setProfile(adminProfile);
      setLoading(false);
      return { data: { user: { id: 'admin-local' } }, error: null };
    }

    // Check for hardcoded NMC credentials
    if (email === NMC_EMAIL && password === NMC_PASS) {
      const nmcProfile = {
        id: 'nmc-local',
        full_name: 'NMC Municipal Office',
        role: 'nmc',
        karma_points: 0,
        total_reports: 0,
        badge_level: 'platinum',
      };
      setUser({ id: 'nmc-local', email: 'nmc@civicfix.local' });
      setProfile(nmcProfile);
      setLoading(false);
      return { data: { user: { id: 'nmc-local' } }, error: null };
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      return { data, error };
    } catch (err) {
      return { data: null, error: { message: err.message || 'Sign in failed' } };
    }
  };

  const signOut = async () => {
    setIsGuest(false);
    setProfile(null);
    setUser(null);
    try { await supabase.auth.signOut(); } catch (e) {}
    return { error: null };
  };

  const enterGuestMode = () => {
    setIsGuest(true);
    setProfile({
      full_name: 'Guest Reporter',
      role: 'citizen',
      karma_points: 0,
      total_reports: 0,
      badge_level: 'newcomer',
    });
  };

  const exitGuestMode = () => {
    setIsGuest(false);
    setProfile(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        isGuest,
        signUp,
        signIn,
        signOut,
        enterGuestMode,
        exitGuestMode,
        refreshProfile: () => user && fetchProfile(user.id, user),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
