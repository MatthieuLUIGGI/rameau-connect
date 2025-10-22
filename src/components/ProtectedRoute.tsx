import { ReactNode, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: ReactNode;
  requireAG?: boolean;
}

const ProtectedRoute = ({ children, requireAG = false }: ProtectedRouteProps) => {
  const { user, isLoading, isAG } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        navigate('/auth');
      } else if (requireAG && !isAG) {
        navigate('/');
      }
    }
  }, [user, isLoading, isAG, requireAG, navigate]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user || (requireAG && !isAG)) {
    return null;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
