import React, { useState, useEffect } from 'react';
import { Activity, Calendar, User, TrendingUp, Clock, Heart, Flame } from 'lucide-react';

// Mock data for demonstration - replace with actual Supabase data
const mockWorkouts = [
  {
    id: 1,
    user_name: 'John Doe',
    activity_type: 'Basketball',
    date: '2024-01-15',
    duration_minutes: 45,
    calories_burned: 420,
    heart_rate_avg: 145,
    distance_km: 3.2,
    raw_message: 'basketball today',
    created_at: '2024-01-15T10:30:00Z'
  },
  {
    id: 2,
    user_name: 'Jane Smith',
    activity_type: 'Running',
    date: '2024-01-15',
    duration_minutes: 30,
    calories_burned: 350,
    heart_rate_avg: 155,
    distance_km: 5.5,
    raw_message: 'morning run',
    created_at: '2024-01-15T08:00:00Z'
  },
  {
    id: 3,
    user_name: 'Mike Johnson',
    activity_type: 'Cycling',
    date: '2024-01-14',
    duration_minutes: 60,
    calories_burned: 580,
    heart_rate_avg: 135,
    distance_km: 20.3,
    raw_message: 'bike ride',
    created_at: '2024-01-14T17:00:00Z'
  }
];

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
        <div className="flex items-center">
          <Flame className="w-4 h-4 text-orange-400 mr-2" />
          <span className="text-sm text-gray-600">{workout.calories_burned} cal</span>
        </div>
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
          <p className="text-sm text-gray-500 italic">"{workout.raw_message}"</p>
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

  // Simulated Supabase data fetching
  useEffect(() => {
    const fetchWorkouts = async () => {
      try {
        // In production, replace with actual Supabase query:
        // const { data, error } = await supabase
        //   .from('workouts')
        //   .select('*')
        //   .order('created_at', { ascending: false })
        //   .limit(20);
        
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        setWorkouts(mockWorkouts);
        
        // Calculate stats
        const totalCalories = mockWorkouts.reduce((sum, w) => sum + w.calories_burned, 0);
        const avgDuration = Math.round(mockWorkouts.reduce((sum, w) => sum + w.duration_minutes, 0) / mockWorkouts.length);
        const uniqueUsers = new Set(mockWorkouts.map(w => w.user_name)).size;
        
        setStats({
          totalWorkouts: mockWorkouts.length,
          totalCalories,
          activeUsers: uniqueUsers,
          avgDuration
        });
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching workouts:', error);
        setLoading(false);
      }
    };

    fetchWorkouts();
    
    // Set up polling for real-time updates
    const interval = setInterval(fetchWorkouts, 30000); // Refresh every 30 seconds
    
    return () => clearInterval(interval);
  }, []);

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
            Powered by ClickUp + Gemini AI + Supabase
          </p>
        </div>
      </div>
    </div>
  );
}