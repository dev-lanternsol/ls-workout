"use client";
import { useEffect, useState } from 'react';
import { getSupabaseBrowser } from '@/lib/supabase/client';
import { Activity, Calendar, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

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
              <h1 className="text-2xl font-bold text-gray-900 hover:underline">Team Workout Dashboard</h1>
            </div>
            <div className="flex items-center text-sm text-gray-500">
              <Calendar className="w-4 h-4 mr-1" />
              {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
          </div>
        </div>
      </div>
      <div className="max-w-4xl mx-auto py-8 px-2">
        <h2 className="text-2xl font-bold mb-6 text-center">{userName} <span className="text-base font-normal text-gray-500">- Last 30 Days</span></h2>

        {/* Activity Breakdown Section */}
        <div className="bg-white rounded-xl shadow p-6 mb-8">
          <h3 className="font-semibold text-lg mb-4">Activity Breakdown</h3>
          <div className="overflow-x-auto rounded-lg">
            <table className="min-w-full text-sm border-separate border-spacing-y-1">
              <thead className="bg-gray-100 sticky top-0 z-10">
                <tr>
                  <th className="px-3 py-2 font-semibold text-gray-700 text-left">Day</th>
                  <th className="px-3 py-2 font-semibold text-gray-700 text-left">Activity</th>
                  <th className="px-3 py-2 font-semibold text-gray-700 text-left">Workouts</th>
                  <th className="px-3 py-2 font-semibold text-gray-700 text-left">Calories</th>
                  <th className="px-3 py-2 font-semibold text-gray-700 text-left">Duration (min)</th>
                </tr>
              </thead>
              <tbody>
                {activity.length === 0 ? (
                  <tr><td colSpan={5} className="text-center text-gray-400 py-6">No activity data found.</td></tr>
                ) : activity.map((row, i) => (
                  <tr key={i} className={i % 2 === 0 ? 'bg-gray-50 hover:bg-blue-50' : 'bg-white hover:bg-blue-50'}>
                    <td className="px-3 py-2">{row.day}</td>
                    <td className="px-3 py-2">{row.activity_type}</td>
                    <td className="px-3 py-2 text-blue-700 font-semibold">{row.workouts}</td>
                    <td className="px-3 py-2">{row.total_calories}</td>
                    <td className="px-3 py-2">{row.total_duration_minutes}</td>
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
