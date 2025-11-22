import { Box, Button } from '@mui/material'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'

function WelcomePage({ onContinue }) {
  return (
    <Box className="min-h-screen bg-white flex flex-col">
      {/* Dark teal header bar */}
      <Box
        sx={{
          backgroundColor: '#008080', // Dark teal
          width: '100%',
          padding: '12px 24px',
          display: 'flex',
          justifyContent: 'flex-end',
          alignItems: 'center',
          minHeight: '56px',
        }}
      >
        {/* Continue button */}
        <Button
          onClick={onContinue}
          sx={{
            backgroundColor: '#e0e0e0', // Light grey background
            color: '#424242', // Dark grey text
            borderRadius: '8px',
            padding: '8px 16px',
            textTransform: 'none',
            fontSize: '14px',
            fontWeight: 500,
            minWidth: 'auto',
            boxShadow: 'none',
            '&:hover': {
              backgroundColor: '#d0d0d0',
              boxShadow: 'none',
            },
          }}
          endIcon={<ArrowForwardIcon sx={{ fontSize: '18px' }} />}
        >
          Continue
        </Button>
      </Box>

      {/* White content area */}
      <Box className="flex-1 flex flex-col items-center justify-start pt-16 px-8">
        {/* Centered title */}
        <h1 className="text-4xl font-normal text-gray-800 mb-6 text-center">
          Welcome to the TOEFL® iBT Sampler!
        </h1>

        {/* Horizontal line */}
        <Box
          sx={{
            width: '60%',
            maxWidth: '600px',
            height: '1px',
            backgroundColor: '#e0e0e0',
            marginBottom: '24px',
          }}
        />

        {/* Left-aligned descriptive text */}
        <Box className="w-full max-w-4xl">
          <p className="text-base text-gray-800 leading-relaxed">
            In this sampler, you will experience each of the task types in the test. You will complete one task per task type in each of the four sections of the test, reading, listening, writing and speaking.
          </p>
        </Box>
      </Box>
    </Box>
  )
}

export default WelcomePage

