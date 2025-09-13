import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Activity, Calendar, User, TrendingUp, Clock, Heart, Flame, Users, Zap } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { getSupabaseBrowser } from '@/lib/supabase/client';

const supabase = getSupabaseBrowser();

// Stats Card Component
const StatsCard = ({ icon: Icon, label, value, color }) => (
  <div className="bg-white rounded-lg shadow-md p-6 border-l-4" style={{ borderLeftColor: color }}>
    <div className="flex items-center justify-between">
      <div>
        <p className="text-gray-500 text-sm font-medium">{label}</p>
        <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
      </div>
      <Icon className="w-8 h-8 opacity-50" style={{ color }} />
    </div>
  </div>
);

// Workout Card Component
const WorkoutCard = ({ workout }) => {
  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const formatTime = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

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

  return (
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
            <User className="w-5 h-5 text-blue-600" />
          </div>
          <div className="ml-3">
            <h3 className="font-semibold text-gray-900">{workout.user_name}</h3>
            <p className="text-sm text-gray-500">{formatDate(workout.date)} at {formatTime(workout.created_at)}</p>
          </div>
        </div>
        <span className="px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full">
          {workout.activity_type}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4 mt-4">
        <div className="flex items-center">
          <Clock className="w-4 h-4 text-gray-400 mr-2" />
          <span className="text-sm text-gray-600">{workout.duration_minutes} min</span>
        </div>
        {workout.calories_burned && (
          <div className="flex items-center">
            <Flame className="w-4 h-4 text-orange-400 mr-2" />
            <span className="text-sm text-gray-600">{workout.calories_burned} cal</span>
          </div>
        )}
        <div className="flex items-center">
          <Heart className="w-4 h-4 text-red-400 mr-2" />
          <span className="text-sm text-gray-600">{workout.heart_rate_avg} bpm</span>
        </div>
        <div className="flex items-center">
          <TrendingUp className="w-4 h-4 text-blue-400 mr-2" />
          <span className="text-sm text-gray-600">{workout.distance_km} km</span>
        </div>
      </div>

      {workout.raw_message && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <p className="text-sm text-gray-500 italic">
            "{renderWithEmojis(workout.raw_message)}"
          </p>
        </div>
      )}
    </div>
  );
};

// Main Dashboard Component
export default function WorkoutDashboard() {
  const [workouts, setWorkouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalWorkouts: 0,
    totalCalories: 0,
    activeUsers: 0,
    avgDuration: 0
  });
  const [userDaily, setUserDaily] = useState([]);
  const [userTotals, setUserTotals] = useState([]);
  const [topCalories, setTopCalories] = useState([]);

  // Simulated Supabase data fetching
  useEffect(() => {
    const fetchAll = async () => {
      try {
        // Recent workouts
        const { data: workoutsData } = await supabase
          .from('workouts_with_user')
          .select(`*`).order('created_at', { ascending: false }).limit(20);
        setWorkouts(workoutsData);

        // Per-user, per-day aggregation (last 30 days)
        const { data: userDailyData } = await supabase
          .from('v_workouts_user_daily')
          .select('*')
          .gte('day', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
          .order('day', { ascending: true })
          .order('user_name', { ascending: true });
        setUserDaily(userDailyData || []);

        // Totals per user (lifetime)
        const { data: userTotalsData } = await supabase
          .from('v_workouts_user_totals')
          .select('*')
          .order('workouts', { ascending: false })
          .limit(10);
        setUserTotals(userTotalsData || []);

        // Top by calories in last 30 days
        const { data: topCaloriesData } = await supabase
          .from('workouts')
          .select('user_name, calories_burned, date')
          .gte('date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
        // Aggregate calories by user
        const caloriesMap = {};
        (topCaloriesData || []).forEach(row => {
          if (!caloriesMap[row.user_name]) caloriesMap[row.user_name] = { user_name: row.user_name, workouts: 0, total_calories: 0 };
          caloriesMap[row.user_name].workouts += 1;
          caloriesMap[row.user_name].total_calories += row.calories_burned || 0;
        });
        const caloriesArr = Object.values(caloriesMap).sort((a, b) => b.total_calories - a.total_calories).slice(0, 10);
        setTopCalories(caloriesArr);

        // Stats
        const totalCalories = (workoutsData || []).reduce((sum, w) => sum + (w.calories_burned || 0), 0);
        const avgDuration = Math.round((workoutsData || []).reduce((sum, w) => sum + (w.duration_minutes || 0), 0) / (workoutsData?.length || 1));
        const uniqueUsers = new Set((workoutsData || []).map(w => w.user_name)).size;
        setStats({
          totalWorkouts: workoutsData?.length || 0,
          totalCalories,
          activeUsers: uniqueUsers,
          avgDuration
        });
        setLoading(false);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setLoading(false);
      }
    };
    fetchAll();
    const interval = setInterval(fetchAll, 30000);
    return () => clearInterval(interval);
  }, []);

  // Chart data for daily activity and calories burned
  const chartData = (workouts || []).reduce((acc, workout) => {
    const date = workout.date;
    const existing = acc.find(item => item.date === date);
    if (existing) {
      existing.workouts += 1;
      existing.calories += workout.calories_burned || 0;
    } else {
      acc.push({
        date,
        workouts: 1,
        calories: workout.calories_burned || 0
      });
    }
    return acc;
  }, []).sort((a, b) => new Date(a.date) - new Date(b.date));

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading workout data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
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

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatsCard
            icon={Activity}
            label="Total Workouts"
            value={stats.totalWorkouts}
            color="#3B82F6"
          />
          <StatsCard
            icon={Flame}
            label="Total Calories"
            value={stats.totalCalories.toLocaleString()}
            color="#F97316"
          />
          <StatsCard
            icon={User}
            label="Active Users"
            value={stats.activeUsers}
            color="#10B981"
          />
          <StatsCard
            icon={Clock}
            label="Avg Duration"
            value={`${stats.avgDuration} min`}
            color="#8B5CF6"
          />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Team Weekly Activity</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="workouts" fill="#3B82F6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Team Calories Burned</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="calories" stroke="#EF4444" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Totals per user (last 30 days) */}
        <div className="mb-8 bg-white rounded-xl shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Top Users by Workouts (Last 30 days)</h2>
          <div className="overflow-x-auto rounded-lg">
            <table className="min-w-full text-sm border-separate border-spacing-y-1">
              <thead className="bg-gray-100 sticky top-0 z-10">
                <tr>
                  <th className="px-3 py-2 font-semibold text-gray-700 text-left">User</th>
                  <th className="px-3 py-2 font-semibold text-gray-700 text-left">Workouts</th>
                  <th className="px-3 py-2 font-semibold text-gray-700 text-left">Calories</th>
                  <th className="px-3 py-2 font-semibold text-gray-700 text-left">Duration (min)</th>
                </tr>
              </thead>
              <tbody>
                {userTotals.map((row, i) => (
                  <tr key={i} className={i % 2 === 0 ? 'bg-gray-50 hover:bg-blue-50' : 'bg-white hover:bg-blue-50'}>
                    <td className="px-3 py-2 font-medium">
                      <Link href={`/dashboard/user/${encodeURIComponent(row.user_name)}`} className="text-blue-600 hover:underline font-semibold">{row.user_name}</Link>
                    </td>
                    <td className="px-3 py-2 text-blue-700 font-semibold">{row.workouts}</td>
                    <td className="px-3 py-2">{row.total_calories}</td>
                    <td className="px-3 py-2">{row.total_duration_minutes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Workouts */}
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Workouts</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {workouts.map((workout) => (
              <WorkoutCard key={workout.id} workout={workout} />
            ))}
          </div>
        </div>

        {/* Empty State */}
        {workouts.length === 0 && (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <Activity className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No workouts yet</h3>
            <p className="text-gray-500">Team members can share their workouts in the ClickUp channel</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="mt-12 py-6 border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-gray-500">
            Powered by ClickUp + Gemini AI + Supabase. Built by <a href="https://lanternsol.com" className="text-blue-600 hover:underline">Lantern Solutions</a>.
          </p>
        </div>
      </div>
    </div>
  );
}