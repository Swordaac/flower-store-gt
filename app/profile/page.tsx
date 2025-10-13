import { UserProfile } from '@/components/auth/UserProfile';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

export default function ProfilePage() {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        
        <div className="py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900">Profile</h1>
              <p className="mt-2 text-gray-600">
                Manage your account information and preferences
              </p>
            </div>
            
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <UserProfile />
              </div>
              
              
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
