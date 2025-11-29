import { Box, Typography, Divider, Button } from '@mui/material'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'

function ModuleEnd({ moduleNumber, nextModuleNumber, sectionName, section, onNext }) {
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
          End of Module {moduleNumber}
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
        {section === 'listening' ? (
          <Box
            sx={{
              textAlign: 'left',
            }}
          >
            <Typography
              sx={{
                fontSize: '16px',
                fontWeight: 400,
                color: '#424242',
                lineHeight: 1.6,
                fontFamily: 'inherit',
                marginBottom: '16px',
              }}
            >
              This is the end of Module {moduleNumber} of the {sectionName} section.
            </Typography>
            {nextModuleNumber && (
              <Typography
                sx={{
                  fontSize: '16px',
                  fontWeight: 400,
                  color: '#424242',
                  lineHeight: 1.6,
                  fontFamily: 'inherit',
                }}
              >
                You will now begin Module {nextModuleNumber}.
              </Typography>
            )}
          </Box>
        ) : (
          <Typography
            sx={{
              fontSize: '16px',
              fontWeight: 400,
              color: '#424242',
              lineHeight: 1.6,
              fontFamily: 'inherit',
              textAlign: 'left',
            }}
          >
            {nextModuleNumber 
              ? `Select Next to continue to Module ${nextModuleNumber}.`
              : 'Select Next to continue.'}
          </Typography>
        )}
      </Box>
    </Box>
  )
}

export default ModuleEnd

