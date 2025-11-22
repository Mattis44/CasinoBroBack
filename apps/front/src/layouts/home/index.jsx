import PropTypes from 'prop-types';

import Stack from '@mui/material/Stack';
import Container from '@mui/material/Container';

import { useSettingsContext } from 'src/components/settings';

import Header from '../common/header-simple';

// ----------------------------------------------------------------------

export default function HomeLayout({ children }) {
  const { themeMode } = useSettingsContext();
  return (
    <>
      <Header />

      <Container component="main" className={themeMode}>
        <Stack>{children}</Stack>
      </Container>
    </>
  );
}

HomeLayout.propTypes = {
  children: PropTypes.node,
};
