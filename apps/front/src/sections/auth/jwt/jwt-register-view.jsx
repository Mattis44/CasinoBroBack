import * as Yup from 'yup';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';

import Link from '@mui/material/Link';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import { Card, Button } from '@mui/material';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';
import InputAdornment from '@mui/material/InputAdornment';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';
import { useRouter, useSearchParams } from 'src/routes/hooks';

import { useBoolean } from 'src/hooks/use-boolean';

import { useAuthContext } from 'src/auth/hooks';
import { PATH_AFTER_LOGIN } from 'src/config-global';

import Iconify from 'src/components/iconify';
import FormProvider, { RHFTextField } from 'src/components/hook-form';

// ----------------------------------------------------------------------

export default function JwtRegisterView() {
  const { register } = useAuthContext();

  const router = useRouter();

  const [errorMsg, setErrorMsg] = useState('');

  const searchParams = useSearchParams();

  const returnTo = searchParams.get('returnTo');

  const password = useBoolean();

  const RegisterSchema = Yup.object().shape({
    username: Yup.string().required('Username is required'),
    email: Yup.string().required('Email is required').email('Email must be a valid email address'),
    password: Yup.string().required('Password is required'),
    referral: Yup.string().optional(),
  });

  const defaultValues = {
    username: '',
    email: '',
    password: '',
    referral: '',
  };

  const methods = useForm({
    resolver: yupResolver(RegisterSchema),
    defaultValues,
  });

  const {
    reset,
    handleSubmit,
    getValues,
    formState: { isSubmitting },
  } = methods;

  const onSubmit = handleSubmit(async (data) => {
    try {
      await register?.(data.email, data.username, data.password, data.referral || '');

      router.push(returnTo || PATH_AFTER_LOGIN);
    } catch (error) {
      console.error(error);
      reset();
      setErrorMsg(typeof error === 'string' ? error : error.message);
    }
  });

  const renderHead = (
    <Card sx={{ mt: 2, padding: 3, width: '30%' }}>
      <Typography variant="h4">Track your invests now !</Typography>

      <Stack direction="row" spacing={0.5}>
        <Typography variant="body2"> Already have an account? </Typography>

        <Link href={paths.auth.jwt.login} component={RouterLink} variant="subtitle2">
          Sign in
        </Link>
      </Stack>
    </Card>
  );

  const renderTerms = (
    <Typography
      component="div"
      sx={{
        mt: 2.5,
        textAlign: 'left',
        typography: 'caption',
        color: 'text.secondary',
      }}
    >
      {'By signing up, I agree to '}
      <Link underline="always" color="text.primary">
        Terms of Service
      </Link>
      {' and '}
      <Link underline="always" color="text.primary">
        Privacy Policy
      </Link>
      .
    </Typography>
  );

  const renderForm = (
    <>
      <RHFTextField name="email" label="Email address" />
      <RHFTextField sx={{ mt: 3 }} name="username" label="Username" />
      <RHFTextField sx={{ mt: 3 }} name="referral" label="Referral code (optional)" />
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

      <LoadingButton
        fullWidth
        color="inherit"
        size="large"
        type="submit"
        variant="contained"
        loading={isSubmitting}
        sx={{ mt: 3 }}
      >
        Create account
      </LoadingButton>
      <Button
        fullWidth
        size="large"
        onClick={() => {
          if (getValues().referral !== '') {
            localStorage.setItem('referral', getValues().referral);
          }
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
        Register using Discord
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
        <Alert severity="error" sx={{ mt: 3 }}>
          {errorMsg}
        </Alert>
      )}

      <Card sx={{ mt: 3, padding: 3, width: '30%' }}>
        <FormProvider methods={methods} onSubmit={onSubmit}>
          {renderForm}
        </FormProvider>
      </Card>
      {renderTerms}
    </div>
  );
}
