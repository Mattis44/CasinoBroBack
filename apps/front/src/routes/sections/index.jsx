import { Navigate, useRoutes } from 'react-router-dom';

import { homeRoute } from './home';
import { mainRoutes } from './main';
import { authRoutes } from './auth';
import { dashboardRoutes } from './dashboard';

// ----------------------------------------------------------------------

export default function Router() {
  return useRoutes([
    // Auth routes
    ...authRoutes,

    // Dashboard routes
    ...dashboardRoutes,

    // Main routes
    ...mainRoutes,

    ...homeRoute,

    // No match 404
    { path: '*', element: <Navigate to="/404" replace /> },
  ]);
}
