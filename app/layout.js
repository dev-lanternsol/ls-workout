// app/layout.js - Update your existing layout
import './globals.css'

export const metadata = {
  title: 'Team Workout Tracker',
  description: 'Track and analyze team fitness activities',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}

// app/page.js - Replace your existing page.js with this
'use client'

import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Activity, Calendar, Users, TrendingUp, Clock, Zap } from 'lucide-react';

// Mock data for development - replace with Supabase data
const mockWorkouts = [
  {
    id: 1,
    date: '2024-09-13',
    individual: 'John Doe',
    workout_type: 'Basketball',
    duration: 45,
    calories: 320,
    heart_rate: 145,
    steps: 3200,
    created_at: '2024-09-13T10:30:00Z'
  },
  {
    id: 2,
    date: '2024-09-13',
    individual: 'Jane Smith',
    workout_type: 'Running',
    duration: 30,
    calories: 280,
    heart_rate: 155,
    steps: 4500,
    created_at: '2024-09-13T09:15:00Z'
  },
  {
    id: 3,
    date: '2024-09-12',
    individual: 'Mike Johnson',
    workout_type: 'Cycling',
    duration: 60,
    calories: 450,
    heart_rate: 138,
    steps: 1200,
    created_at: '2024-09-12T18:20:00Z'
  }
];

// Stats cards component
const StatsCard = ({ title, value, icon: Icon, color }) => (
  <div className="bg-white rounded-lg shadow-md p-6 border-l-4" style={{ borderLeftColor: color }}>
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-600">{title}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
      </div>
      <Icon className="h-8 w-8" style={{ color }} />
    </div>
  </div>
);

// Workout list component
const WorkoutList = ({ workouts }) => (
  <div className="bg-white rounded-lg shadow-md">
    <div className="px-6 py-4 border-b border-gray-200">
      <h3 className="text-lg font-medium text-gray-900">Recent Workouts</h3>
    </div>
    <div className="divide-y divide-gray-200">
      {workouts.map((workout) => (
        <div key={workout.id} className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex-shrink-0">
              <Activity className="h-6 w-6 text-blue-500" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">{workout.individual}</p>
              <p className="text-sm text-gray-500">{workout.workout_type}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium text-gray-900">{workout.duration} min</p>
            <p className="text-sm text-gray-500">{workout.calories} cal</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-400">
              {new Date(workout.date).toLocaleDateString()}
            </p>
          </div>
        </div>
      ))}
    </div>
  </div>
);

// Main Dashboard Component
export default function WorkoutDashboard() {
  const [workouts, setWorkouts] = useState(mockWorkouts);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    totalWorkouts: 0,
    totalCalories: 0,
    averageDuration: 0,
    activeMembers: 0
  });

  // Calculate stats from workouts
  useEffect(() => {
    const totalWorkouts = workouts.length;
    const totalCalories = workouts.reduce((sum, w) => sum + w.calories, 0);
    const averageDuration = workouts.reduce((sum, w) => sum + w.duration, 0) / workouts.length;
    const activeMembers = new Set(workouts.map(w => w.individual)).size;

    setStats({
      totalWorkouts,
      totalCalories,
      averageDuration: Math.round(averageDuration),
      activeMembers
    });
  }, [workouts]);

  // Chart data for weekly activity
  const chartData = workouts.reduce((acc, workout) => {
    const date = workout.date;
    const existing = acc.find(item => item.date === date);
    
    if (existing) {
      existing.workouts += 1;
      existing.calories += workout.calories;
    } else {
      acc.push({
        date,
        workouts: 1,
        calories: workout.calories
      });
    }
    
    return acc;
  }, []).sort((a, b) => new Date(a.date) - new Date(b.date));

  // Function to fetch workouts from API
  const fetchWorkouts = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/workouts');
      if (response.ok) {
        const data = await response.json();
        setWorkouts(data);
      }
    } catch (error) {
      console.error('Error fetching workouts:', error);
    } finally {
      setLoading(false);
    }
  };

  // Function to simulate workout submission (for testing)
  const simulateWorkoutSubmission = async () => {
    const mockMessage = {
      text: "Had a great basketball session today! 🏀",
      user: "Alex Wilson",
      timestamp: new Date().toISOString()
    };

    try {
      const response = await fetch('/api/webhook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(mockMessage)
      });
      
      if (response.ok) {
        // Refresh workouts after successful submission
        fetchWorkouts();
      }
    } catch (error) {
      console.error('Error processing workout:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Team Workout Dashboard</h1>
          <p className="text-gray-600 mt-2">Track and analyze team fitness activities</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatsCard
            title="Total Workouts"
            value={stats.totalWorkouts}
            icon={Activity}
            color="#3B82F6"
          />
          <StatsCard
            title="Total Calories"
            value={stats.totalCalories.toLocaleString()}
            icon={Zap}
            color="#EF4444"
          />
          <StatsCard
            title="Avg Duration"
            value={`${stats.averageDuration} min`}
            icon={Clock}
            color="#10B981"
          />
          <StatsCard
            title="Active Members"
            value={stats.activeMembers}
            icon={Users}
            color="#F59E0B"
          />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Daily Activity</h3>
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
            <h3 className="text-lg font-medium text-gray-900 mb-4">Calories Burned</h3>
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

        {/* Workout List */}
        <WorkoutList workouts={workouts} />

        {/* Test Button (for development) */}
        <div className="mt-8 flex justify-center">
          <button
            onClick={simulateWorkoutSubmission}
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg transition-colors"
            disabled={loading}
          >
            {loading ? 'Processing...' : 'Simulate Workout Submission'}
          </button>
        </div>
      </div>
    </div>
  );
}

// app/api/webhook/route.js - NEW FILE
import { GoogleGenerativeAI } from '@google/generative-ai';
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export async function POST(request) {
  try {
    const { text, user, timestamp, imageUrl, channelId } = await request.json();

    // Validate required fields
    if (!text || !user) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }

    // Process the message with Gemini AI
    const workoutData = await processWorkoutMessage(text, user, imageUrl);

    // Store in Supabase
    const { data, error } = await supabase
      .from('workouts')
      .insert([{
        ...workoutData,
        raw_message: text,
        channel_id: channelId,
        created_at: timestamp || new Date().toISOString()
      }]);

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ message: 'Database error', error }, { status: 500 });
    }

    return NextResponse.json({ 
      message: 'Workout processed successfully', 
      data: workoutData 
    });

  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

async function processWorkoutMessage(text, user, imageUrl) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    let prompt = `
    Analyze this workout message and extract structured information:
    Message: "${text}"
    User: "${user}"
    
    Please extract and return ONLY a JSON object with these fields:
    - individual: The person's name
    - workout_type: Type of exercise (e.g., "Running", "Basketball", "Cycling")
    - date: Today's date in YYYY-MM-DD format
    - duration: Estimated workout duration in minutes (number)
    - calories: Estimated calories burned (number)
    - notes: Any additional notes or details
    
    If specific data isn't available, make reasonable estimates based on the workout type.
    Return only valid JSON, no additional text.
    `;

    let result;

    if (imageUrl) {
      // Process image with text
      const imageResponse = await fetch(imageUrl);
      const imageBuffer = await imageResponse.arrayBuffer();
      const imageBase64 = Buffer.from(imageBuffer).toString('base64');

      result = await model.generateContent([
        prompt,
        {
          inlineData: {
            data: imageBase64,
            mimeType: imageResponse.headers.get('content-type') || 'image/jpeg'
          }
        }
      ]);
    } else {
      result = await model.generateContent(prompt);
    }

    const response = await result.response;
    const text_response = response.text();
    
    const cleanedResponse = text_response.replace(/```json|```/g, '').trim();
    const workoutData = JSON.parse(cleanedResponse);

    return {
      individual: workoutData.individual || user,
      workout_type: workoutData.workout_type || 'General Fitness',
      date: workoutData.date || new Date().toISOString().split('T')[0],
      duration: workoutData.duration || 30,
      calories: workoutData.calories || 200,
      heart_rate: workoutData.heart_rate || null,
      steps: workoutData.steps || null,
      distance: workoutData.distance || null,
      notes: workoutData.notes || null
    };

  } catch (error) {
    console.error('AI processing error:', error);
    
    return {
      individual: user,
      workout_type: 'General Fitness',
      date: new Date().toISOString().split('T')[0],
      duration: 30,
      calories: 200,
      heart_rate: null,
      steps: null,
      distance: null,
      notes: text
    };
  }
}

// app/api/workouts/route.js - NEW FILE
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET(request) {
  try {
    const { data, error } = await supabase
      .from('workouts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ message: 'Database error' }, { status: 500 });
    }

    return NextResponse.json(data || []);
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

// app/globals.css - UPDATE your existing file
@tailwind base;
@tailwind components;
@tailwind utilities;