"use client";
import { useEffect, useState } from 'react';
import { getSupabaseBrowser } from '@/lib/supabase/client';

export default function UserDetails({ userName }) {
  const [activity, setActivity] = useState([]);
  const [daily, setDaily] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const supa = getSupabaseBrowser();
      // Activity breakdown
      let { data: activityData } = await supa
        .from('v_workouts_user_activity_breakdown')
        .select('*')
        .eq('user_name', userName)
        .gte('day', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
        .order('day', { ascending: true })
        .order('activity_type', { ascending: true });
      // Per-day stats
      let { data: dailyData } = await supa
        .from('v_workouts_user_daily')
        .select('*')
        .eq('user_name', userName)
        .gte('day', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
        .order('day', { ascending: true });
      setActivity(activityData || []);
      setDaily(dailyData || []);
      setLoading(false);
    }
    fetchData();
  }, [userName]);

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">{userName} - Last 30 Days</h2>
      <h3 className="font-semibold mt-4">Activity Breakdown</h3>
      <table className="min-w-full text-sm mb-6">
        <thead>
          <tr>
            <th>Day</th>
            <th>Activity</th>
            <th>Workouts</th>
            <th>Calories</th>
            <th>Duration (min)</th>
          </tr>
        </thead>
        <tbody>
          {activity.map((row, i) => (
            <tr key={i}>
              <td>{row.day}</td>
              <td>{row.activity_type}</td>
              <td>{row.workouts}</td>
              <td>{row.total_calories}</td>
              <td>{row.total_duration_minutes}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <h3 className="font-semibold mt-4">Per-Day Stats</h3>
      <table className="min-w-full text-sm">
        <thead>
          <tr>
            <th>Day</th>
            <th>Workouts</th>
            <th>Calories</th>
            <th>Duration (min)</th>
          </tr>
        </thead>
        <tbody>
          {daily.map((row, i) => (
            <tr key={i}>
              <td>{row.day}</td>
              <td>{row.workouts}</td>
              <td>{row.total_calories}</td>
              <td>{row.total_duration_minutes}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
