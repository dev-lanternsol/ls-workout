import { Activity, Calendar, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

const Header = ({ 
  backToHome = false, 
  dateRange = null, 
  onDateRangeChange = null 
}) => {
  const handleDateRangeChange = (field, value) => {
    if (onDateRangeChange && dateRange) {
      onDateRangeChange({
        ...dateRange,
        [field]: value
      });
    }
  };

  return (  
    <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              {backToHome && (
                <Link href="/" className="mr-4 flex items-center text-blue-600 hover:underline">
                  <ArrowLeft className="w-5 h-5 mr-1" />
                  Back
                </Link>
              )}
              <Activity className="w-8 h-8 text-blue-600 mr-3" />
              <h1 className="text-2xl font-bold text-gray-900">Team Workout Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              {dateRange && onDateRangeChange ? (
                <div className="flex items-center space-x-2 text-sm text-gray-500">
                  <Calendar className="w-4 h-4" />
                  <span>From:</span>
                  <input
                    type="date"
                    value={dateRange.startDate}
                    onChange={(e) => handleDateRangeChange('startDate', e.target.value)}
                    className="border border-gray-300 rounded px-2 py-1 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <span>To:</span>
                  <input
                    type="date"
                    value={dateRange.endDate}
                    onChange={(e) => handleDateRangeChange('endDate', e.target.value)}
                    className="border border-gray-300 rounded px-2 py-1 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              ) : (
                <div className="flex items-center text-sm text-gray-500">
                  <Calendar className="w-4 h-4 mr-1" />
                  {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </div>
              )}
            </div>
          </div>
        </div>  
      </div>
  );
}

export default Header;