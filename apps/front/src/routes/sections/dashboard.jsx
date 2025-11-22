import { Suspense } from 'react';
import { Outlet } from 'react-router-dom';

import { AuthGuard } from 'src/auth/guard';
import DashboardLayout from 'src/layouts/dashboard';

import { LoadingScreen } from 'src/components/loading-screen';
import Play from 'src/pages/play/view';
import Blackjack from 'src/pages/play/blackjack';
import CoinFlip from 'src/pages/play/coinflip';
import ChatPage from 'src/pages/play/chat';



// ----------------------------------------------------------------------


// ----------------------------------------------------------------------

export const dashboardRoutes = [
  {
    path: 'app',
    element: (
      <AuthGuard>
        <DashboardLayout>
          <Suspense fallback={<LoadingScreen />}>
            <Outlet />
          </Suspense>
        </DashboardLayout>
      </AuthGuard>
    ),
    children: [
      { element: <Play />, index: true },
      {
        path: 'blackjack',
        element: <Blackjack />,
      },
      {
        path: 'coinflip',
        element: <CoinFlip />,
      },
      {
        path: 'chat',
        element: <ChatPage />,
      }
      // {
      //   path: 'wallet',
      //   element: <WalletPage />,
      // },
    ],
  },
];
