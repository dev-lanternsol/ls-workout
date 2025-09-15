import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Activity } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { getSupabaseBrowser } from '@/lib/supabase/client';
import WorkoutCard from '../ui/WorkoutCard';
import Footer from '../ui/Footer';
import Header from '../ui/Header';
import StatsGrid from '../ui/StatsGrid';

const supabase = getSupabaseBrowser();

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
  const [userTotals, setUserTotals] = useState([]);
  const [userAvatars, setUserAvatars] = useState({});

  // Simulated Supabase data fetching
  useEffect(() => {
    const fetchAll = async () => {
      try {
        // Recent workouts
        const { data: workoutsData } = await supabase
          .from('workouts_with_user')
          .select(`*`).order('created_at', { ascending: false }).limit(20);
        setWorkouts(workoutsData);

        // Fetch user avatars from team_users
        const { data: teamUsers } = await supabase
          .from('team_users')
          .select('user_id, avatar_url');
        const avatarMap = {};
        (teamUsers || []).forEach(u => {
          if (u.user_id && u.avatar_url) avatarMap[u.user_id] = u.avatar_url;
        });
        console.log('Avatar map:', avatarMap);
        setUserAvatars(avatarMap);

        // Totals per user (lifetime)
        const { data: userTotalsData } = await supabase
          .from('v_workouts_user_totals')
          .select('*')
          .order('workouts', { ascending: false })
          .limit(20);
        setUserTotals(userTotalsData || []);

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
      <Header />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <StatsGrid stats={stats} />

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
                  <th className="px-3 py-2 font-semibold text-gray-700 text-left">Total Duration (min)</th>
                  <th className="px-3 py-2 font-semibold text-gray-700 text-left">Total Calories Burned</th>
                </tr>
              </thead>
              <tbody>
                {userTotals.map((row, i) => (
                  <tr key={i} className={i % 2 === 0 ? 'bg-gray-50 hover:bg-blue-50' : 'bg-white hover:bg-blue-50'}>
                    <td className="px-3 py-2 font-medium">
                      <Link href={`/dashboard/user/${encodeURIComponent(row.user_id)}`} className="text-blue-600 hover:underline font-semibold">{row.user_name}</Link>
                    </td>
                    <td className="px-3 py-2 font-semibold">{row.workouts}</td>
                    <td className="px-3 py-2">{row.total_duration_minutes}</td>
                    <td className="px-3 py-2">{row.total_calories}</td>
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
            {workouts.map((workout, idx) => (
              <WorkoutCard
                key={`${'user-report'}-${workout.created_at || idx}`}
                workout={workout}
                avatarUrl={userAvatars[workout.user_id]}
              />
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

      <Footer />
    </div>
  );
}