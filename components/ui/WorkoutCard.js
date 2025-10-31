import { Clock, Flame, Heart, Route, User, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

const WorkoutCard = ({ workout, avatarUrl }) => {
  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      timeZone: 'UTC'
    });
  };

  const formatTime = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'UTC'
    });
  };

  const renderWithEmojis = (text) => {
    if (!text) return '';
    return text.replace(/([0-9a-fA-F]{4,6})/g, (match) => {
      try {
        const codePoint = parseInt(match, 16);
        if (codePoint >= 0x1F300 && codePoint <= 0x1FAFF) {
          return String.fromCodePoint(codePoint);
        }
        return match;
      } catch {
        return match;
      }
    });
  };

  // Check for missing data
  const isMissingData =
    !workout.duration_minutes ||
    !workout.calories_burned ||
    !workout.heart_rate_avg ||
    !workout.distance_km;

  return (
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow relative">
      {isMissingData && (
        <div className="absolute bottom-5 right-4 flex items-center group" style={{ pointerEvents: 'auto' }}>
          <div className="relative">
            <AlertTriangle className="w-5 h-5 text-yellow-500" />
            <span className="pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity bg-yellow-100 text-yellow-900 text-xs rounded px-2 py-1 absolute right-8 bottom-0 z-10 shadow-lg whitespace-wrap w-48">
              Warning: this workout data is incomplete, please double check that the input message contains enough information.
            </span>
          </div>
        </div>
      )}

      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={workout.user_name}
              className="w-10 h-10 rounded-full object-cover border border-gray-200"
            />
          ) : (
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-blue-600" />
            </div>
          )}
          <div className="ml-3">
            {/* link to the user's profile if available */}
            {workout.user_id ? (
              <Link href={`/dashboard/user/${encodeURIComponent(workout.user_id)}`} className="font-semibold text-gray-900">
                <h3>{workout.user_name}</h3>
              </Link>
            ) : (
              <h3 className="font-semibold text-gray-900">{workout.user_name}</h3>
            )}
            <p className="text-sm text-gray-500">{formatDate(workout.date)} at {formatTime(workout.created_at)}</p>
          </div>
        </div>
        <span className="px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full uppercase">
          {workout.activity_type}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4 mt-4">
        <div className="flex items-center">
          <Clock className="w-4 h-4 text-gray-400 mr-2" />
          <span className="text-sm text-gray-600">{workout.duration_minutes || '--'} min</span>
        </div>
        <div className="flex items-center">
          <Flame className="w-4 h-4 text-orange-400 mr-2" />
          <span className="text-sm text-gray-600">{workout.calories_burned || '--'} cal</span>
        </div>
        <div className="flex items-center">
          <Heart className="w-4 h-4 text-red-400 mr-2" />
          <span className="text-sm text-gray-600">{workout.heart_rate_avg || '--'} bpm</span>
        </div>
        <div className="flex items-center">
          <Route className="w-4 h-4 text-blue-400 mr-2" />
          <span className="text-sm text-gray-600">{workout.distance_km || '--'} km</span>
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

export default WorkoutCard;