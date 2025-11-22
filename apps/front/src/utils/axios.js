import axios from 'axios';

import { HOST_API } from 'src/config-global';

// ----------------------------------------------------------------------

const axiosInstance = axios.create({ baseURL: HOST_API });

axiosInstance.interceptors.response.use(
  (res) => res,
  (error) => Promise.reject((error.response && error.response.data) || 'Something went wrong')
);

export default axiosInstance;

// ----------------------------------------------------------------------

export const fetcher = async (args) => {
  const [url, config] = Array.isArray(args) ? args : [args];

  const res = await axiosInstance.get(url, { ...config });

  return res.data;
};

// ----------------------------------------------------------------------

export const endpoints = {
  auth: {
    me: '/api/v1/account/me',
    login: '/api/v1/account/login',
    register: '/api/v1/account/register',
    discord: '/api/v1/account/discord',
  },
  user: {
    action: '/api/v1/user/action',
  },
};
