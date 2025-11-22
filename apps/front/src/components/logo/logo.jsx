import PropTypes from 'prop-types';
import { forwardRef } from 'react';

import Link from '@mui/material/Link';

import { RouterLink } from 'src/routes/components';

import { useSettingsContext } from '../settings';

// ----------------------------------------------------------------------

const Logo = forwardRef(({ disabledLink = false, sx, ...other }, ref) => {
  const settings = useSettingsContext();
  const logoUrl = settings.themeMode === 'dark' ? '/logo/IB_light.svg' : '/logo/IB_dark.svg';

  const logo = (
    <img
      src={logoUrl}
      style={{ width: 100, cursor: 'pointer', ...sx }}
      alt="IB Logo"
    />
  );

  if (disabledLink) {
    return logo;
  }

  return (
    <Link component={RouterLink} href="/" sx={{ display: 'contents' }}>
      {logo}
    </Link>
  );
});

Logo.propTypes = {
  disabledLink: PropTypes.bool,
  sx: PropTypes.object,
};

export default Logo;
