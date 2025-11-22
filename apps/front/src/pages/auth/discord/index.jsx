import { useState, useEffect } from 'react';

import { useRouter, useSearchParams } from 'src/routes/hooks';

import axios from 'src/utils/axios';

import { useAuthContext } from 'src/auth/hooks';
import { PATH_AFTER_LOGIN } from 'src/config-global';

const DiscordOAuth = () => {
  const [code, setCode] = useState(null);
  const [token, setToken] = useState(null);
  const [refreshToken, setRefreshToken] = useState(null);
  const discordCode = new URLSearchParams(window.location.search).get('code');
  const router = useRouter();
  const searchParams = useSearchParams();
  const { register } = useAuthContext();
  const returnTo = searchParams.get('returnTo');

  const CLIENT_ID = '1218929281321930872';
  const SECRET = '2S0a4T13BpDcSl1G_fLwlbs4MNI-4vDU';

  useEffect(() => {
    console.log(discordCode);
    if (!discordCode) {
      return;
    }
    setCode(discordCode);
  }, [discordCode]);

  useEffect(() => {
    if (!code) {
      return;
    }
    const getToken = async () => {
      const response = await axios.post(
        'https://discord.com/api/v10/oauth2/token',
        {
          grant_type: 'authorization_code',
          code,
          redirect_uri: 'http://localhost:3031/auth/discord',
        },
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          auth: {
            username: CLIENT_ID,
            password: SECRET,
          },
        }
      );
      setToken(response.data?.access_token);
      setRefreshToken(response.data?.refresh_token);
    };

    getToken();
  }, [code]);

  useEffect(() => {
    if (!token || !refreshToken) {
      return;
    }
    const reg = async () => {
      try {
        await register('discord', token, refreshToken, localStorage.getItem('referral') || '');
        router.push(returnTo || PATH_AFTER_LOGIN);
      } catch (error) {
        console.error(error);
      }
    };

    reg();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);
  return <div>Redirecting...</div>;
};

export default DiscordOAuth;
