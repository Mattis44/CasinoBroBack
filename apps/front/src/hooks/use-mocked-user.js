import { useAuthContext } from 'src/auth/hooks';

// ----------------------------------------------------------------------

export function useMockedUser() {
  const { user, dispatch } = useAuthContext();

  const updateUser = (newUser) => {
    const userObject = { ...user, ...newUser };
    localStorage.setItem('user', JSON.stringify(userObject));
    dispatch({ type: 'UPDATE_USER', payload: { user: newUser } });
  }
  return { user, updateUser };
}
