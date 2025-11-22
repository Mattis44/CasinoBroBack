import { createContext } from 'react';

// ----------------------------------------------------------------------

export const AuthContext = createContext({
    user: null,
    loading: true,
    login: () => Promise.resolve(),
    register: () => Promise.resolve(),
    logout: () => Promise.resolve(),
});
