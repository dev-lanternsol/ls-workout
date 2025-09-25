import { Activity, Flame, Users, Clock } from "lucide-react";
import StatsCard from "./StatsCard";

const StatsGrid = ({ stats }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <StatsCard
        icon={Activity}
        label="Total Workout Sessions"
        value={stats.totalWorkouts}
        color="#3B82F6"
      />
      <StatsCard
        icon={Flame}
        label="Total Calories Burned"
        value={stats.totalCalories.toLocaleString()}
        color="#F97316"
      />
      <StatsCard
        icon={Users}
        label="Active Team Members"
        value={stats.activeUsers}
        color="#10B981"
      />
      <StatsCard
        icon={Clock}
        label="Avg Duration of Each Session"
        value={`${stats.avgDuration} min`}
        color="#8B5CF6"
      />
    </div>
  );
};

export default StatsGrid;