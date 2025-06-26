import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { supabase } from '@/lib/supabaseClient';

export function useSupabaseUser() {
  const { user, isSignedIn, isLoaded } = useUser();
  const [supabaseUser, setSupabaseUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getOrCreateSupabaseUser = async () => {
      if (!isLoaded) {
        setLoading(false);
        return;
      }

      if (!isSignedIn || !user) {
        setSupabaseUser(null);
        setLoading(false);
        return;
      }

      try {
        // First try to get existing user
        const { data: existingUser, error: fetchError } = await supabase
          .from('users')
          .select('*')
          .eq('clerk_id', user.id)
          .single();

        if (fetchError && fetchError.code !== 'PGRST116') {
          console.error('Error fetching user:', fetchError);
          setLoading(false);
          return;
        }

        if (existingUser) {
          setSupabaseUser(existingUser);
          setLoading(false);
          return;
        }

        // Create new user if doesn't exist
        const { data: newUser, error: createError } = await supabase
          .from('users')
          .insert([
            {
              clerk_id: user.id,
              username: user.username || `user_${user.id.slice(0, 8)}`,
              avatar_url: user.imageUrl,
            }
          ])
          .select()
          .single();

        if (createError) {
          console.error('Error creating user:', createError);
          setLoading(false);
          return;
        }

        setSupabaseUser(newUser);
      } catch (error) {
        console.error('Error in getOrCreateSupabaseUser:', error);
      } finally {
        setLoading(false);
      }
    };

    getOrCreateSupabaseUser();
  }, [isSignedIn, user, isLoaded]);

  return {
    supabaseUser,
    loading,
    isSignedIn,
    user
  };
} 