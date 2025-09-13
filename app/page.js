'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import WorkoutDashboard from '@/components/WorkoutDashboard';

export default function DashboardPage() {
  const [workouts, setWorkouts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWorkouts();
    
    // Set up real-time subscription
    const subscription = supabase
      .channel('workouts')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'workouts' },
        handleRealtimeUpdate
      )
      .subscribe();
    
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchWorkouts = async () => {
    try {
      const { data, error } = await supabase
        .from('workouts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      
      setWorkouts(data || []);
    } catch (error) {
      console.error('Error fetching workouts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRealtimeUpdate = (payload) => {
    if (payload.eventType === 'INSERT') {
      setWorkouts(prev => [payload.new, ...prev]);
    }
  };

  return <WorkoutDashboard workouts={workouts} loading={loading} />;
}