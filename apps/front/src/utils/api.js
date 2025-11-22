import axios from 'axios';

import { HOST_API, VERSION_API } from 'src/config-global';

class Api {
  static async get(url, config) {
    const accessToken =
      localStorage.getItem('accessToken') ?? localStorage.getItem('discord_access_token');
    const refreshToken =
      localStorage.getItem('refreshToken') ?? localStorage.getItem('discord_refresh_token');

    const response = await axios.get(`${HOST_API}api/${VERSION_API}${url}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'x-refresh-token': refreshToken,
        'x-oauth-type': localStorage.getItem('connection_type') ?? undefined,
      },
      ...config,
    });
    if (response.config.headers.Authorization.split(' ')[1] !== accessToken) {
      localStorage.setItem('accessToken', response.config.headers.Authorization.split(' ')[1]);
    }
    return response.data;
  }

  static async post(url, data, config) {
    const accessToken =
      localStorage.getItem('accessToken') ?? localStorage.getItem('discord_access_token');
    const refreshToken =
      localStorage.getItem('refreshToken') ?? localStorage.getItem('discord_refresh_token');

    const response = await axios.post(`${HOST_API}api/${VERSION_API}${url}`, data, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'x-refresh-token': refreshToken,
        'x-oauth-type': localStorage.getItem('connection_type') ?? undefined,
      },
      ...config,
    });
    if (response.config.headers.Authorization.split(' ')[1] !== accessToken) {
      localStorage.setItem('accessToken', response.config.headers.Authorization.split(' ')[1]);
    }
    return { ...response.data, status: response.status };
  }

  static async put(url, data, config) {
    const accessToken =
      localStorage.getItem('accessToken') ?? localStorage.getItem('discord_access_token');
    const refreshToken =
      localStorage.getItem('refreshToken') ?? localStorage.getItem('discord_refresh_token');

    const response = await axios.put(`${HOST_API}api/${VERSION_API}${url}`, data, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'x-refresh-token': refreshToken,
        'x-oauth-type': localStorage.getItem('connection_type') ?? undefined,
      },
      ...config,
    });
    if (response.config.headers.Authorization.split(' ')[1] !== accessToken) {
      localStorage.setItem('accessToken', response.config.headers.Authorization.split(' ')[1]);
    }
    return response.data;
  }

  static async delete(url, config) {
    const accessToken =
      localStorage.getItem('accessToken') ?? localStorage.getItem('discord_access_token');
    const refreshToken =
      localStorage.getItem('refreshToken') ?? localStorage.getItem('discord_refresh_token');

    const response = await axios.delete(`${HOST_API}api/${VERSION_API}${url}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'x-refresh-token': refreshToken,
        'x-oauth-type': localStorage.getItem('connection_type') ?? undefined,
      },
      ...config,
    });
    if (response.config.headers.Authorization.split(' ')[1] !== accessToken) {
      localStorage.setItem('accessToken', response.config.headers.Authorization.split(' ')[1]);
    }
    return response.data;
  }

}

export default Api;
