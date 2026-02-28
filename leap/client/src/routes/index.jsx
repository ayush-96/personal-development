import { createBrowserRouter } from 'react-router-dom';

import Layout from '@/components/layout/MainLayout'; 
import Login from '@/pages/Login';
import Home from '@/pages/Home';
import ChatPage from '@/pages/ChatPage';
import Quiz from '@/pages/Quiz';
import Dashboard from '@/pages/Dashboard';
import ProtectedRoute from '@/routes/ProtectedRoute';

const router = createBrowserRouter([
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/',
    element: (
        <ProtectedRoute>
          <Layout />
        </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <Home />,
      },
      {
        path: '/chat/:spaceId',
        element: <ChatPage />,
      },
      {
        path: '/quiz',
        element: <Quiz />,
      },
      {
        path: '/dashboard',
        element: <Dashboard />,
      },
    ],
  },
]);

export default router;