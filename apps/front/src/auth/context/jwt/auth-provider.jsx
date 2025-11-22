import PropTypes from 'prop-types';
import { useMemo, useEffect, useReducer, useCallback } from 'react';

import axios, { endpoints } from 'src/utils/axios';

import { AuthContext } from './auth-context';
import { setSession, isValidSession } from './utils';


const initialState = {
  user: null,
  loading: true,
};

const reducer = (state, action) => {
  if (action.type === 'INITIAL') {
    return {
      loading: false,
      user: action.payload.user,
    };
  }
  if (action.type === 'LOGIN') {
    return {
      ...state,
      user: action.payload.user,
    };
  }
  if (action.type === 'REGISTER') {
    return {
      ...state,
      user: action.payload.user,
    };
  }
  if (action.type === 'LOGOUT') {
    return {
      ...state,
      user: null,
    };
  }
  if (action.type === 'UPDATE_USER') {
    return {
      ...state,
      user: {
        ...state.user,
        ...action.payload.user,
      },
    };
  }
  return state;
};

// ----------------------------------------------------------------------

export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  const initialize = useCallback(async () => {
    try {
      const accessToken =
        localStorage.getItem('accessToken') ?? localStorage.getItem('discord_access_token');
      const refreshToken =
        localStorage.getItem('refreshToken') ?? localStorage.getItem('discord_refresh_token');
      const oauthType = localStorage.getItem('connection_type') ?? null;
      const isValidTokens = await isValidSession(accessToken, refreshToken, oauthType);
      if (accessToken && refreshToken && isValidTokens) {
        const { access_token, user } = isValidTokens;
        localStorage.setItem(`${oauthType ? 'discord_access_token' : 'accessToken'}`, access_token);
        dispatch({
          type: 'INITIAL',
          payload: {
            user: {
              ...user,
              access_token,
            },
          },
        });
      } else {
        console.log('No valid session');

        dispatch({
          type: 'INITIAL',
          payload: {
            user: null,
          },
        });
      }
    } catch (error) {
      console.error(error);
      dispatch({
        type: 'INITIAL',
        payload: {
          user: null,
        },
      });
    }
  }, []);

  useEffect(() => {
    initialize();
  }, [initialize]);

  // LOGIN
  const login = useCallback(async (username, password) => {
    const response = await axios.post(
      `${endpoints.auth.login}?str_username=${username}&str_password=${password}`
    );
    const { token_access, refresh_token, user } = response.data;

    setSession(token_access, refresh_token, user);

    dispatch({
      type: 'LOGIN',
      payload: {
        user: {
          ...user,
          token_access,
        },
      },
    });
  }, []);

  // REGISTER
  const register = useCallback(async (elem1 = null, elem2 = null, elem3 = null, elem4 = null) => {
    let user;
    let token_access;
    if (elem1 === 'discord') {
      const tokenAccess = elem2;
      const refreshToken = elem3;
      const referralCode = elem4;
      const response = await axios.post(`${endpoints.auth.discord}/register?code=${tokenAccess}${referralCode !== '' ? `&referral=${referralCode}` : ''}`);
      if (response.data?.id_user === "-1") {
        return;
      }
      // eslint-disable-next-line prefer-destructuring
      user = response.data;

      localStorage.setItem('discord_access_token', tokenAccess);
      localStorage.setItem('discord_refresh_token', refreshToken);
      localStorage.setItem('connection_type', 'discord');
      localStorage.setItem('user', JSON.stringify(user));
    } else {
      const response = await axios.post(
        `${endpoints.auth.register}?str_email=${elem1}&str_username=${elem2}&str_password=${elem3}&str_referral=${elem4}`
      );
      const { token_access: token_access_session, refresh_token: refresh_token_session } =
        response.data;
      // eslint-disable-next-line prefer-destructuring
      user = response.data.user;
      setSession(token_access_session, refresh_token_session, user);
    }

    dispatch({
      type: 'REGISTER',
      payload: {
        user: {
          ...user,
          token_access,
        },
      },
    });
  }, []);

  // LOGOUT
  const logout = useCallback(async () => {
    setSession(null);
    dispatch({
      type: 'LOGOUT',
    });
  }, []);

  // ----------------------------------------------------------------------

  const checkAuthenticated = state.user ? 'authenticated' : 'unauthenticated';

  const status = state.loading ? 'loading' : checkAuthenticated;


  const memoizedValue = useMemo(
    () => ({
      user: state.user,
      method: 'jwt',
      loading: status === 'loading',
      authenticated: status === 'authenticated',
      unauthenticated: status === 'unauthenticated',
      login,
      register,
      logout,
      dispatch,
    }),
    [login, logout, register, state.user, status]
  );

  return <AuthContext.Provider value={memoizedValue}>{children}</AuthContext.Provider>;
}

AuthProvider.propTypes = {
  children: PropTypes.node,
};
