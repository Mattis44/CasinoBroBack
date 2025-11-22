import { lazy, Suspense } from 'react';
import { Outlet } from 'react-router-dom';

import { GuestGuard } from 'src/auth/guard';
import DiscordOAuth from 'src/pages/auth/discord';

import { SplashScreen } from 'src/components/loading-screen';
import { JwtRegisterView } from 'src/sections/auth/jwt';

// ----------------------------------------------------------------------

// JWT
const JwtLoginPage = lazy(() => import('src/pages/auth/login'));
// const JwtRegisterPage = lazy(() => import('src/pages/auth/register'));

// ----------------------------------------------------------------------

const authJwt = {
  element: (
    <Suspense fallback={<SplashScreen />}>
      <Outlet />
    </Suspense>
  ),
  children: [
    {
      path: 'login',
      element: (
        <GuestGuard>
          <JwtLoginPage />
        </GuestGuard>
      ),
    },
    {
      path: 'register',
      element: (
        <GuestGuard>
          <JwtRegisterView />
        </GuestGuard>
      ),
    },
    {
      path: 'discord',
      element: (
        <GuestGuard>
          <DiscordOAuth />
        </GuestGuard>
      ),
    },
  ],
};

export const authRoutes = [
  {
    path: 'auth',
    children: [authJwt],
  },
];
