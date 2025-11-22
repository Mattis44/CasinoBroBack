import * as Yup from 'yup';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';

import Alert from '@mui/material/Alert';
import { Card, Button, Link, InputAdornment, IconButton, Typography, Stack } from '@mui/material';

import { paths } from 'src/routes/paths';
import { useRouter, useSearchParams } from 'src/routes/hooks';


import { useAuthContext } from 'src/auth/hooks';
import { PATH_AFTER_LOGIN } from 'src/config-global';

import Iconify from 'src/components/iconify';
import FormProvider, { RHFTextField } from 'src/components/hook-form';
import { LoadingButton } from '@mui/lab';
import { RouterLink } from 'src/routes/components';
import { useBoolean } from 'src/hooks/use-boolean';

// ----------------------------------------------------------------------

export default function JwtLoginView() {
  const { login } = useAuthContext();

  const router = useRouter();

  const [errorMsg, setErrorMsg] = useState('');

  const searchParams = useSearchParams();

  const returnTo = searchParams.get('returnTo');

  const password = useBoolean();

  const LoginSchema = Yup.object().shape({
    username: Yup.string().required('Username is required'),
    password: Yup.string().required('Password is required'),
  });

  const defaultValues = {
    username: 'mattis',
    password: 'motdepasse',
  };

  const methods = useForm({
    resolver: yupResolver(LoginSchema),
    defaultValues,
  });

  const {
    reset,
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  const onSubmit = handleSubmit(async (data) => {
    try {
      await login?.(data.username, data.password);

      router.push(returnTo || PATH_AFTER_LOGIN);
    } catch (error) {
      console.error(error);
      reset();
      setErrorMsg(typeof error === 'string' ? error : error.message);
    }
  });

  const renderHead = (
    <Card sx={{ mt: 2, padding: 3, width: '30%' }}>
      <Typography variant="h4">Sign in to InvestBox</Typography>

      <Stack direction="row" spacing={0.5}>
        <Typography variant="body2">New user?</Typography>

        <Link component={RouterLink} href={paths.auth.jwt.register} variant="subtitle2">
          Create an account
        </Link>
      </Stack>
    </Card>
  );

  const renderForm = (
    <>
      <RHFTextField name="username" label="Username" />

      <RHFTextField
        sx={{ mt: 3 }}
        name="password"
        label="Password"
        type={password.value ? 'text' : 'password'}
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              <IconButton onClick={password.onToggle} edge="end">
                <Iconify icon={password.value ? 'solar:eye-bold' : 'solar:eye-closed-bold'} />
              </IconButton>
            </InputAdornment>
          ),
        }}
      />

      <Link variant="body2" color="inherit" underline="always" sx={{ alignSelf: 'flex-end' }}>
        Forgot password?
      </Link>

      <LoadingButton
        fullWidth
        color="inherit"
        size="large"
        type="submit"
        variant="contained"
        loading={isSubmitting}
        sx={{ mt: 3 }}
      >
        Login
      </LoadingButton>
      <Button
        fullWidth
        size="large"
        onClick={() => {
          window.location.href = paths.auth.discord.root;
        }}
        variant="contained"
        sx={{
          mt: 3,
          backgroundColor: '#5865F2',
          color: 'white',
          ':hover': { backgroundColor: '#404AB1' },
        }}
        startIcon={<Iconify icon="ic:baseline-discord" />}
      >
        Login using Discord
      </Button>
    </>
  );

  return (
    <div
      style={{
        height: '90%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      {renderHead}

      {!!errorMsg && (
        <Alert severity="error" sx={{ width: '30%', mt: 3 }}>
          {errorMsg}
        </Alert>
      )}

      <Card sx={{ mt: 3, padding: 3, width: '30%' }}>
        <FormProvider methods={methods} onSubmit={onSubmit}>
          {renderForm}
        </FormProvider>
      </Card>
    </div>
  );
}
