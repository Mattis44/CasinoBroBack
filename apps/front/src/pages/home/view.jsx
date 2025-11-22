import { useNavigate } from 'react-router';
import { Button, Typography } from '@mui/material';

export default function Home() {
  const navigate = useNavigate();


  return (
    <div className="relative w-full min-h-screen overflow-hidden">
      <div className="flex flex-col items-center justify-center h-[40rem] relative z-10 text-center gap-4">
        <Typography variant="h2" className="text-4xl font-bold text-white">
          Play the best Social Casino Now !
        </Typography>
        <Button
          variant="contained"
          color="primary"
          size="large"
          onClick={() => {
            navigate('/app');
          }}
        >
          Play
        </Button>
      </div>
    </div>
  );
}
