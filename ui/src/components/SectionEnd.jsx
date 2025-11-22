import { Box, Typography, Button, Divider } from '@mui/material'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'

function SectionEnd({ sectionName, onNext }) {
  return (
    <Box className="min-h-screen bg-white">
      {/* Top Navigation Bar with Next button */}
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
        <Button
          onClick={onNext}
          sx={{
            border: '1px solid #008080',
            backgroundColor: 'white',
            color: '#008080',
            borderRadius: '8px',
            padding: '8px 16px',
            textTransform: 'none',
            fontSize: '14px',
            fontWeight: 500,
            minWidth: 'auto',
            boxShadow: 'none',
            '&:hover': {
              backgroundColor: '#f5f5f5',
              boxShadow: 'none',
            },
          }}
          endIcon={<ChevronRightIcon sx={{ fontSize: '20px' }} />}
        >
          Next
        </Button>
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
        {/* Main Heading - Top Left */}
        <Typography
          sx={{
            fontSize: '32px',
            fontWeight: 600,
            color: '#424242',
            fontFamily: 'inherit',
            marginBottom: '16px',
            textAlign: 'left',
          }}
        >
          End of {sectionName} Section
        </Typography>

        {/* Divider line */}
        <Divider
          sx={{
            width: '100%',
            marginBottom: '32px',
            borderColor: '#e0e0e0',
          }}
        />

        {/* Description - Left Aligned */}
        <Typography
          sx={{
            fontSize: '16px',
            fontWeight: 400,
            color: '#424242',
            fontFamily: 'inherit',
            textAlign: 'left',
            lineHeight: 1.6,
          }}
        >
          Thank you for completing the {sectionName.toLowerCase()} section.
        </Typography>
      </Box>
    </Box>
  )
}

export default SectionEnd

