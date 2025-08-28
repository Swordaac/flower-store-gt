import { AuthForm } from '@/components/auth/AuthForm';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

export default function SignInPage() {
  return (
    <ProtectedRoute requireAuth={false}>
      <AuthForm defaultMode="signin" />
    </ProtectedRoute>
  );
}
