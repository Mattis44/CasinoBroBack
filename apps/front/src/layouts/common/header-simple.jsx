import Stack from '@mui/material/Stack';
import AppBar from '@mui/material/AppBar';
import { IconButton } from '@mui/material';
import Toolbar from '@mui/material/Toolbar';
import { useTheme } from '@mui/material/styles';

import { useOffSetTop } from 'src/hooks/use-off-set-top';

import { bgBlur } from 'src/theme/css';

import Logo from 'src/components/logo';
import Iconify from 'src/components/iconify';
import { useSettingsContext } from 'src/components/settings';

import { HEADER } from '../config-layout';
import HeaderShadow from './header-shadow';

// ----------------------------------------------------------------------

export default function HeaderSimple() {
  const theme = useTheme();
  const settings = useSettingsContext();

  const offsetTop = useOffSetTop(HEADER.H_DESKTOP);

  return (
    <AppBar>
      <Toolbar
        sx={{
          justifyContent: 'space-between',
          height: {
            xs: HEADER.H_MOBILE,
            md: HEADER.H_DESKTOP,
          },
          transition: theme.transitions.create(['height'], {
            easing: theme.transitions.easing.easeInOut,
            duration: theme.transitions.duration.shorter,
          }),
          ...(offsetTop && {
            ...bgBlur({
              color: theme.palette.background.default,
            }),
            height: {
              md: HEADER.H_DESKTOP_OFFSET,
            },
          }),
        }}
      >
        <Logo />

        <Stack direction="row" alignItems="center" spacing={1} />
        <IconButton
          onClick={
            settings.themeMode === 'dark'
              ? () => settings.onUpdate('themeMode', 'light')
              : () => settings.onUpdate('themeMode', 'dark')
          }
        >
          {settings.themeMode === 'dark' ? (
            <Iconify icon="material-symbols:light-mode" />
          ) : (
            <Iconify icon="material-symbols:dark-mode" />
          )}
        </IconButton>
      </Toolbar>

      {offsetTop && <HeaderShadow />}
    </AppBar>
  );
}
