import 'src/global.css';

// ----------------------------------------------------------------------

import Router from 'src/routes/sections';

import ThemeProvider from 'src/theme';

import { useScrollToTop } from 'src/hooks/use-scroll-to-top';

import ProgressBar from 'src/components/progress-bar';
import { MotionLazy } from 'src/components/animate/motion-lazy';
import { SettingsDrawer, SettingsProvider } from 'src/components/settings';

import { AuthProvider } from 'src/auth/context/jwt';
// eslint-disable-next-line import/no-extraneous-dependencies
import { Toaster } from 'react-hot-toast';
import { SocketProvider } from './contexts/socket/ws';

// ----------------------------------------------------------------------

export default function App() {
  useScrollToTop();

  return (
    <>
      <AuthProvider>
        <SocketProvider>
          <SettingsProvider
            defaultSettings={{
              themeMode: 'dark', // 'light' | 'dark'
              themeDirection: 'ltr', //  'rtl' | 'ltr'
              themeContrast: 'default', // 'default' | 'bold'
              themeLayout: 'vertical', // 'vertical' | 'horizontal' | 'mini'
              themeColorPresets: 'default', // 'default' | 'cyan' | 'purple' | 'blue' | 'orange' | 'red'
              themeStretch: false,
            }}
          >
            <ThemeProvider>
              <MotionLazy>
                <SettingsDrawer />
                <ProgressBar />
                <Router />
              </MotionLazy>
            </ThemeProvider>
          </SettingsProvider>
        </SocketProvider>
      </AuthProvider>
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 5000,
          style: {
            background: "#333",
            color: "#fff",
          },
        }}
      />
    </>
  );
}
