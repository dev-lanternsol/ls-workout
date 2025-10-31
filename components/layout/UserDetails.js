"use client";
import { useEffect, useState } from "react";
import { getSupabaseBrowser } from "@/lib/supabase/client";
import { isAdmin, reprocessWorkout } from "@/lib/admin-utils";
import Header from "../ui/Header";
import AvatarWithProgressBar from "../ui/AvatarWithProgressBar";
import Footer from "../ui/Footer";

// Helper to replace unicode like "1f525" with emoji
const renderWithEmojis = (text) => {
  if (!text) return "";
  // Replace all occurrences of unicode codepoints like "1f525" or "1F525"
  return text.replace(/([0-9a-fA-F]{4,6})/g, (match) => {
    try {
      const codePoint = parseInt(match, 16);
      // Only replace if it's a valid emoji codepoint
      if (codePoint >= 0x1f300 && codePoint <= 0x1faff) {
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
  const [adminMode, setAdminMode] = useState(false);
  const [reprocessing, setReprocessing] = useState({}); // Track reprocessing status per workout

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const supa = getSupabaseBrowser();
      // Activity history (last 30 days)
      let { data: activityData } = await supa
        .from("workouts")
        .select(
          "id, date, activity_type, calories_burned, duration_minutes, raw_message"
        )
        .eq("user_id", user_id)
        .gte(
          "date",
          new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
            .toISOString()
            .split("T")[0]
        )
        .order("date", { ascending: true })
        .order("activity_type", { ascending: true });
      // Per-day stats (last 30 days)
      let { data: dailyData } = await supa
        .from("v_workouts_user_daily")
        .select("*")
        .eq("user_id", user_id)
        .gte(
          "day",
          new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
            .toISOString()
            .split("T")[0]
        )
        .order("day", { ascending: true });
      // Avatar
      let { data: userRow } = await supa
        .from("team_users")
        .select("avatar_url, user_name")
        .eq("user_id", user_id)
        .maybeSingle();
      setUserName(userRow?.user_name || user_id);
      setAvatarUrl(userRow?.avatar_url || null);
      // Monthly workout count (current calendar month)
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
        .toISOString()
        .split("T")[0];
      const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)
        .toISOString()
        .split("T")[0];
      let { count: monthlyWorkoutCount } = await supa
        .from("workouts")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user_id)
        .gte("date", monthStart)
        .lte("date", monthEnd);
      setMonthlyCount(monthlyWorkoutCount || 0);
      setActivity(activityData || []);
      setDaily(dailyData || []);
      setLoading(false);
    }
    fetchData();
  }, [user_id]);

  // Check admin mode on component mount
  useEffect(() => {
    setAdminMode(isAdmin());
  }, []);

  // Handle reprocessing individual workouts
  const handleReprocess = async (workoutId) => {
    setReprocessing(prev => ({ ...prev, [workoutId]: 'loading' }));
    
    try {
      const result = await reprocessWorkout(workoutId);
      
      if (result.success) {
        setReprocessing(prev => ({ ...prev, [workoutId]: 'success' }));
        console.log('Reprocess succeeded:', result.data);
        // Clear success status after 3 seconds
        setTimeout(() => {
          setReprocessing(prev => ({ ...prev, [workoutId]: null }));
        }, 3000);
      } else {
        setReprocessing(prev => ({ ...prev, [workoutId]: 'error' }));
        console.error('Reprocess failed:', result.data || result.error);
      }
    } catch (error) {
      setReprocessing(prev => ({ ...prev, [workoutId]: 'error' }));
      console.error('Reprocess error:', error);
    }
  };

  if (loading)
    return <div className="py-12 text-center text-gray-500">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <Header backToHome={true} />
      
      {/* Admin Mode Indicator */}
      {adminMode && (
        <div className="bg-orange-100 border-l-4 border-orange-500 text-orange-700 p-4">
          <div className="max-w-4xl mx-auto">
            <p className="font-medium">🔧 Admin Mode Active - Reprocess buttons are visible</p>
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto py-8 px-2">
        <div className="flex flex-col items-center mb-4 relative">
          {/* Avatar with progress border and badge */}
          {avatarUrl && (
            <AvatarWithProgressBar
              imageUrl={avatarUrl}
              progress={monthlyCount}
            />
          )}
          <h2 className="text-2xl font-bold text-center">
            {userName}{" "}
            <span className="text-base font-normal text-gray-500">
              - Last 30 Days
            </span>
          </h2>
        </div>

        {/* Activity Breakdown Section */}
        <div className="bg-white rounded-xl shadow p-6 mb-8">
          <h3 className="font-semibold text-lg mb-4">Activity Breakdown</h3>
          <div className="overflow-x-auto rounded-lg">
            <table className="min-w-full text-sm border-separate border-spacing-y-1">
              <thead className="bg-gray-100 sticky top-0 z-10">
                <tr>
                  <th className="px-3 py-2 font-semibold text-gray-700 text-left">
                    Day
                  </th>
                  <th className="px-3 py-2 font-semibold text-gray-700 text-left">
                    Activity
                  </th>
                  <th className="px-3 py-2 font-semibold text-gray-700 text-left">
                    Calories
                  </th>
                  <th className="px-3 py-2 font-semibold text-gray-700 text-left">
                    Duration (min)
                  </th>
                  <th className="px-3 py-2 font-semibold text-gray-700 text-left">
                    Note
                  </th>
                  {adminMode && (
                    <th className="px-3 py-2 font-semibold text-gray-700 text-left">
                      Actions
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {activity.length === 0 ? (
                  <tr>
                    <td colSpan={adminMode ? 6 : 5} className="text-center text-gray-400 py-6">
                      No activity data found.
                    </td>
                  </tr>
                ) : (
                  activity.map((row, i) => (
                    <tr
                      key={i}
                      className={
                        i % 2 === 0
                          ? "bg-gray-50 hover:bg-blue-50"
                          : "bg-white hover:bg-blue-50"
                      }
                    >
                      <td className="px-3 py-2">{row.date}</td>
                      <td className="px-3 py-2 uppercase">{row.activity_type}</td>
                      <td className="px-3 py-2">{row.calories_burned}</td>
                      <td className="px-3 py-2">{row.duration_minutes}</td>
                      <td className="px-3 py-2">
                        {renderWithEmojis(row.raw_message)}
                      </td>
                      {adminMode && (
                        <td className="px-3 py-2">
                          <button
                            onClick={() => handleReprocess(row.id)}
                            disabled={reprocessing[row.id] === 'loading'}
                            className={`px-2 py-1 text-xs rounded font-medium transition-colors ${
                              reprocessing[row.id] === 'loading'
                                ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                                : reprocessing[row.id] === 'success'
                                ? 'bg-green-100 text-green-700'
                                : reprocessing[row.id] === 'error'
                                ? 'bg-red-100 text-red-700'
                                : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                            }`}
                          >
                            {reprocessing[row.id] === 'loading' && '⏳'}
                            {reprocessing[row.id] === 'success' && '✓'}
                            {reprocessing[row.id] === 'error' && '✗'}
                            {!reprocessing[row.id] && '🔄'} Reprocess
                          </button>
                        </td>
                      )}
                    </tr>
                  ))
                )}
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
                  <th className="px-3 py-2 font-semibold text-gray-700 text-left">
                    Day
                  </th>
                  <th className="px-3 py-2 font-semibold text-gray-700 text-left">
                    Workouts
                  </th>
                  <th className="px-3 py-2 font-semibold text-gray-700 text-left">
                    Calories
                  </th>
                  <th className="px-3 py-2 font-semibold text-gray-700 text-left">
                    Duration (min)
                  </th>
                </tr>
              </thead>
              <tbody>
                {daily.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center text-gray-400 py-6">
                      No daily stats found.
                    </td>
                  </tr>
                ) : (
                  daily.map((row, i) => (
                    <tr
                      key={i}
                      className={
                        i % 2 === 0
                          ? "bg-gray-50 hover:bg-blue-50"
                          : "bg-white hover:bg-blue-50"
                      }
                    >
                      <td className="px-3 py-2">{row.day}</td>
                      <td className="px-3 py-2 text-blue-700 font-semibold">
                        {row.workouts}
                      </td>
                      <td className="px-3 py-2">{row.total_calories}</td>
                      <td className="px-3 py-2">
                        {row.total_duration_minutes}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
