import { lazy } from 'react';
import { Outlet } from 'react-router-dom';

import HomeLayout from 'src/layouts/home';

// ----------------------------------------------------------------------

const Home = lazy(() => import('src/pages/home/view'));

// ----------------------------------------------------------------------

export const homeRoute = [
  {
    element: (
      <HomeLayout>
        <Outlet />
      </HomeLayout>
    ),
    children: [{ path: '/', element: <Home /> }],
  },
];
