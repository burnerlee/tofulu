import { Box, Typography, Divider, Button } from '@mui/material'
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'

function TimeRemainingWarning({ timeRemaining, onBack, onContinue }) {
  const formatTime = (totalSeconds) => {
    const hours = Math.floor(totalSeconds / 3600)
    const mins = Math.floor((totalSeconds % 3600) / 60)
    const secs = totalSeconds % 60
    return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
  }

  return (
    <Box className="min-h-screen bg-white">
      {/* Top Navigation Bar */}
      <Box
        sx={{
          backgroundColor: '#008080',
          width: '100%',
          padding: '12px 24px',
          display: 'flex',
          justifyContent: 'flex-end',
          alignItems: 'center',
          minHeight: '56px',
        }}
      >
        <Box sx={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <Button
            onClick={onBack}
            sx={{
              border: '1px solid white',
              backgroundColor: '#008080',
              color: 'white',
              borderRadius: '8px',
              padding: '8px 16px',
              textTransform: 'none',
              fontSize: '14px',
              fontWeight: 500,
              boxShadow: 'none',
              '&:hover': {
                backgroundColor: '#006666',
                boxShadow: 'none',
              },
            }}
            startIcon={<ChevronLeftIcon sx={{ fontSize: '20px' }} />}
          >
            Back
          </Button>
          <Button
            onClick={onContinue}
            sx={{
              border: '1px solid #008080',
              backgroundColor: 'white',
              color: '#008080',
              borderRadius: '8px',
              padding: '8px 16px',
              textTransform: 'none',
              fontSize: '14px',
              fontWeight: 500,
              boxShadow: 'none',
              '&:hover': {
                backgroundColor: '#f5f5f5',
                boxShadow: 'none',
              },
            }}
            endIcon={<ChevronRightIcon sx={{ fontSize: '20px' }} />}
          >
            Continue
          </Button>
        </Box>
      </Box>

      {/* Main Content */}
      <Box
        sx={{
          maxWidth: '1400px',
          margin: '0 auto',
          padding: '64px 48px 48px 64px',
          minHeight: 'calc(100vh - 56px)',
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
        }}
      >
        {/* Title */}
        <Typography
          sx={{
            fontSize: '32px',
            fontWeight: 600,
            color: '#424242',
            marginBottom: '16px',
            textAlign: 'left',
            fontFamily: 'inherit',
          }}
        >
          Time Remaining
        </Typography>

        {/* Divider line */}
        <Divider
          sx={{
            width: '100%',
            marginBottom: '32px',
            borderColor: '#e0e0e0',
          }}
        />

        {/* Instructions */}
        <Box
          sx={{
            textAlign: 'left',
            maxWidth: '800px',
          }}
        >
          <Typography
            sx={{
              fontSize: '16px',
              fontWeight: 400,
              color: '#424242',
              lineHeight: 1.6,
              marginBottom: '16px',
              fontFamily: 'inherit',
            }}
          >
            You still have time to respond. As long as there is time remaining, you can keep writing or revise your response.
          </Typography>
          <Typography
            sx={{
              fontSize: '16px',
              fontWeight: 400,
              color: '#424242',
              lineHeight: 1.6,
              marginBottom: '16px',
              fontFamily: 'inherit',
            }}
          >
            Select Back to keep writing or revising.
          </Typography>
          <Typography
            sx={{
              fontSize: '16px',
              fontWeight: 400,
              color: '#424242',
              lineHeight: 1.6,
              marginBottom: '16px',
              fontFamily: 'inherit',
            }}
          >
            Select Continue to leave this question.
          </Typography>
          <Typography
            sx={{
              fontSize: '16px',
              fontWeight: 400,
              color: '#424242',
              lineHeight: 1.6,
              fontFamily: 'inherit',
            }}
          >
            Once you leave this question, you{' '}
            <Box component="span" sx={{ fontWeight: 700 }}>
              WILL NOT
            </Box>{' '}
            be able to return to it.
          </Typography>
        </Box>
      </Box>
    </Box>
  )
}

export default TimeRemainingWarning

