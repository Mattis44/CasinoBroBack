import { paths } from 'src/routes/paths';

import axios, { endpoints } from 'src/utils/axios';

// ----------------------------------------------------------------------

// eslint-disable-next-line no-unused-vars
function jwtDecode(token) {
  const base64Url = token.split('.')[1];
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  const jsonPayload = decodeURIComponent(
    window
      .atob(base64)
      .split('')
      .map((c) => `%${`00${c.charCodeAt(0).toString(16)}`.slice(-2)}`)
      .join('')
  );

  return JSON.parse(jsonPayload);
}

// ----------------------------------------------------------------------

export const isValidSession = async (accessToken, refreshToken, oauthType) => {
  try {
    let response;
    if (!oauthType) {
      response = await axios.post(endpoints.auth.me, {
        accessToken,
        refreshToken,
      });
      console.log('normal', response.data);
    } else {
      response = await axios.post(`${endpoints.auth.discord}/me`, {
        access_token: accessToken,
        refresh_token: refreshToken,
      });
      console.log('discord', response.data);
    }
    if (response.status === 200) {
      console.log('Valid');
      const { access_token, user } = response.data;
      if (!access_token || !user) {
        return null;
      }
      return { access_token, user };
    }
    if (response.status === 201) {
      console.log('Refreshed');
      const { access_token, user } = response.data;
      if (!access_token || !user) {
        return null;
      }
      return { access_token, user };
    }
    return null;
  } catch (error) {
    console.error(`Error while verifying session : ${error}`);
    return null;
  }
};

// ----------------------------------------------------------------------

export const tokenExpired = (exp) => {
  // eslint-disable-next-line prefer-const
  let expiredTimer;

  const currentTime = Date.now();

  // Test token expires after 10s
  // const timeLeft = currentTime + 10000 - currentTime; // ~10s
  const timeLeft = exp * 1000 - currentTime;

  clearTimeout(expiredTimer);

  expiredTimer = setTimeout(() => {
    alert('Token expired');

    localStorage.removeItem('accessToken');

    window.location.href = paths.auth.jwt.login;
  }, timeLeft);
};

// ----------------------------------------------------------------------

export const setSession = (accessToken, refreshToken, user) => {
  if (accessToken && refreshToken && user) {
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    localStorage.setItem('user', JSON.stringify(user));
  } else {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    localStorage.removeItem('discord_access_token');
    localStorage.removeItem('discord_refresh_token');
    localStorage.removeItem('connection_type');
  }
};
