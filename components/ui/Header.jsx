import { Activity, Calendar, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import LogOut from '../layout/LogOutForm';
import { createClient } from '@/lib/supabase/server';

const Header = async ({ backToHome = false }) => {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

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
            <div className="flex items-center text-sm text-gray-500">
              {user && (
                <div className="flex items-center space-x-4">
                  <span className="ml-4 text-gray-700">Hello, {user.user_metadata.username || user.email}</span>
                  <LogOut />
                </div>
              )}
            </div>
          </div>
        </div>  
      </div>
  );
}

export default Header;