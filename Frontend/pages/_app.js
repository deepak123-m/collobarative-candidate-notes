import { AuthProvider } from '@/contexts/AuthContext';
import { SocketProvider } from '@/contexts/SocketContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import '@/styles/globals.css';

function MyApp({ Component, pageProps, router }) {
  const publicRoutes = ['/login', '/register'];
  const isPublicRoute = publicRoutes.includes(router.pathname);

  return (
    <AuthProvider>
      <SocketProvider>
        {isPublicRoute ? (
          <Component {...pageProps} />
        ) : (
          <ProtectedRoute>
            <Component {...pageProps} />
          </ProtectedRoute>
        )}
      </SocketProvider>
    </AuthProvider>
  );
}

export default MyApp;