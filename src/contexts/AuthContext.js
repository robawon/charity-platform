import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();
      if (error) { setProfile(null); return null; }
      setProfile(data);
      return data;
    } catch (err) {
      setProfile(null);
      return null;
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        await fetchProfile(session.user.id);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error(error.message);

    // Check if seller is suspended
    if (data.user) {
      const { data: profileData } = await supabase
        .from('users')
        .select('*')
        .eq('id', data.user.id)
        .single();

      if (profileData?.role === 'seller' && profileData?.status === 'suspended') {
        await supabase.auth.signOut();
        throw new Error('Your account is suspended. Please contact the administrator to activate your account.');
      }
    }
    return data;
  };

  const signUp = async (email, password, name, role = 'seller') => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: window.location.origin },
    });
    if (error) throw new Error(error.message);
    if (!data.user) throw new Error('Account created but email confirmation may be required.');

    // New sellers are suspended by default
    const { error: profileError } = await supabase
      .from('users')
      .insert([{
        id: data.user.id,
        name: name.trim(),
        email: email.trim().toLowerCase(),
        role: 'seller',
        status: 'suspended', // Always suspended until admin activates
      }]);

    if (profileError && !profileError.message.includes('duplicate')) {
      throw new Error('Profile creation failed: ' + profileError.message);
    }
    return data;
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  };

  const value = {
    user,
    profile,
    loading,
    signIn,
    signUp,
    signOut,
    isAdmin: profile?.role === 'admin',
    isSeller: profile?.role === 'seller',
    isActive: profile?.status === 'active',
    isSuspended: profile?.status === 'suspended',
    refreshProfile: () => user && fetchProfile(user.id),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};