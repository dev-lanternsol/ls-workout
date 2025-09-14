"use client";
import { useEffect, useState } from 'react';
import { getSupabaseBrowser } from '@/lib/supabase/client';
import { Activity, Calendar, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

// Helper to replace unicode like "1f525" with emoji
const renderWithEmojis = (text) => {
  if (!text) return '';
  // Replace all occurrences of unicode codepoints like "1f525" or "1F525"
  return text.replace(/([0-9a-fA-F]{4,6})/g, (match) => {
    try {
      const codePoint = parseInt(match, 16);
      // Only replace if it's a valid emoji codepoint
      if (codePoint >= 0x1F300 && codePoint <= 0x1FAFF) {
        return String.fromCodePoint(codePoint);
      }
      return match;
    } catch {
      return match;
    }
  });
};

export default function UserDetails({ user_id }) {
  const [activity, setActivity] = useState([]);
  const [daily, setDaily] = useState([]);
  const [userName, setUserName] = useState(null);
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [monthlyCount, setMonthlyCount] = useState(0);
  const WORKOUT_GOAL = 11;

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const supa = getSupabaseBrowser();
      // Activity history (last 30 days)
      let { data: activityData } = await supa
        .from('workouts')
        .select('date, activity_type, calories_burned, duration_minutes, raw_message')
        .eq('user_id', user_id)
        .gte('date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
        .order('date', { ascending: true })
        .order('activity_type', { ascending: true });
      // Per-day stats (last 30 days)
      let { data: dailyData } = await supa
        .from('v_workouts_user_daily')
        .select('*')
        .eq('user_id', user_id)
        .gte('day', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
        .order('day', { ascending: true });
      // Avatar
      let { data: userRow } = await supa
        .from('team_users')
        .select('avatar_url, user_name')
        .eq('user_id', user_id)
        .maybeSingle();
      setUserName(userRow?.user_name || user_id);
      setAvatarUrl(userRow?.avatar_url || null);
      // Monthly workout count (current calendar month)
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
      let { count: monthlyWorkoutCount } = await supa
        .from('workouts')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user_id)
        .gte('date', monthStart)
        .lte('date', monthEnd);
      setMonthlyCount(monthlyWorkoutCount || 0);
      setActivity(activityData || []);
      setDaily(dailyData || []);
      setLoading(false);
    }
    fetchData();
  }, [user_id]);

  if (loading) return <div className="py-12 text-center text-gray-500">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
        <div className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Link href="/" className="mr-4 flex items-center text-blue-600 hover:underline">
              <ArrowLeft className="w-5 h-5 mr-1" />
              Back
            </Link>
            <Activity className="w-8 h-8 text-blue-600 mr-3" />
            <h1 className="text-2xl font-bold text-gray-900">Team Workout Dashboard</h1>
          </div>
          <div className="flex items-center text-sm text-gray-500">
            <Calendar className="w-4 h-4 mr-1" />
            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
            </div>
          </div>
        </div>
        <div className="max-w-4xl mx-auto py-8 px-2">
          <div className="flex flex-col items-center mb-4 relative">
            {/* Avatar with progress border and badge */}
            {avatarUrl && (
          <div className="relative flex items-center justify-center mb-2" style={{ width: 132, height: 132 }}>
            {/* Progress border */}
            <svg width="132" height="132" className="absolute top-0 left-0 z-0" style={{ pointerEvents: 'none' }}>
              <circle
            cx="66"
            cy="66"
            r="61.5"
            fill="none"
            stroke="#e5e7eb"
            strokeWidth="7.5"
              />
              <circle
            cx="66"
            cy="66"
            r="61.5"
            fill="none"
            stroke={
              monthlyCount >= WORKOUT_GOAL
                ? '#22c55e' // green
                : monthlyCount >= WORKOUT_GOAL * 0.75
                ? '#facc15' // yellow
                : monthlyCount >= WORKOUT_GOAL * 0.5
                ? '#f97316' // orange
                : '#ef4444' // red
            }
            strokeWidth="7.5"
            strokeDasharray={2 * Math.PI * 61.5}
            strokeDashoffset={
              2 * Math.PI * 61.5 * (1 - Math.min(monthlyCount / WORKOUT_GOAL, 1))
            }
            style={{ transition: 'stroke-dashoffset 0.5s, stroke 0.5s' }}
              />
            </svg>
            <img
              src={avatarUrl}
              alt={user_id}
              className="w-30 h-30 rounded-full object-cover border-4 border-white shadow z-10"
              style={{ position: 'relative', width: 120, height: 120 }}
            />
            {/* Badge */}
            <span className="absolute top-3 right-2 bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded-full shadow border border-white z-20" style={{ transform: 'translate(40%, -40%)' }}>
              {monthlyCount} / {WORKOUT_GOAL}
            </span>
          </div>
            )}
            <h2 className="text-2xl font-bold text-center">{userName} <span className="text-base font-normal text-gray-500">- Last 30 Days</span></h2>
          </div>

          {/* Activity Breakdown Section */}
        <div className="bg-white rounded-xl shadow p-6 mb-8">
          <h3 className="font-semibold text-lg mb-4">Activity Breakdown</h3>
          <div className="overflow-x-auto rounded-lg">
            <table className="min-w-full text-sm border-separate border-spacing-y-1">
              <thead className="bg-gray-100 sticky top-0 z-10">
                <tr>
                  <th className="px-3 py-2 font-semibold text-gray-700 text-left">Day</th>
                  <th className="px-3 py-2 font-semibold text-gray-700 text-left">Activity</th>
                  <th className="px-3 py-2 font-semibold text-gray-700 text-left">Calories</th>
                  <th className="px-3 py-2 font-semibold text-gray-700 text-left">Duration (min)</th>
                  <th className="px-3 py-2 font-semibold text-gray-700 text-left">Note</th>
                </tr>
              </thead>
              <tbody>
                {activity.length === 0 ? (
                  <tr><td colSpan={5} className="text-center text-gray-400 py-6">No activity data found.</td></tr>
                ) : activity.map((row, i) => (
                  <tr key={i} className={i % 2 === 0 ? 'bg-gray-50 hover:bg-blue-50' : 'bg-white hover:bg-blue-50'}>
                    <td className="px-3 py-2">{row.date}</td>
                    <td className="px-3 py-2">{row.activity_type}</td>
                    <td className="px-3 py-2">{row.calories_burned}</td>
                    <td className="px-3 py-2">{row.duration_minutes}</td>
                    <td className="px-3 py-2">{renderWithEmojis(row.raw_message)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Per-Day Stats Section */}
        <div className="bg-white rounded-xl shadow p-6">
          <h3 className="font-semibold text-lg mb-4">Per-Day Stats</h3>
          <div className="overflow-x-auto rounded-lg">
            <table className="min-w-full text-sm border-separate border-spacing-y-1">
              <thead className="bg-gray-100 sticky top-0 z-10">
                <tr>
                  <th className="px-3 py-2 font-semibold text-gray-700 text-left">Day</th>
                  <th className="px-3 py-2 font-semibold text-gray-700 text-left">Workouts</th>
                  <th className="px-3 py-2 font-semibold text-gray-700 text-left">Calories</th>
                  <th className="px-3 py-2 font-semibold text-gray-700 text-left">Duration (min)</th>
                </tr>
              </thead>
              <tbody>
                {daily.length === 0 ? (
                  <tr><td colSpan={4} className="text-center text-gray-400 py-6">No daily stats found.</td></tr>
                ) : daily.map((row, i) => (
                  <tr key={i} className={i % 2 === 0 ? 'bg-gray-50 hover:bg-blue-50' : 'bg-white hover:bg-blue-50'}>
                    <td className="px-3 py-2">{row.day}</td>
                    <td className="px-3 py-2 text-blue-700 font-semibold">{row.workouts}</td>
                    <td className="px-3 py-2">{row.total_calories}</td>
                    <td className="px-3 py-2">{row.total_duration_minutes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
