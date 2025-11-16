import { Box, Button } from '@mui/material'
import VolumeUpIcon from '@mui/icons-material/VolumeUp'
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'

function TopNavigation({ onPrevious, onNext, canGoPrevious, canGoNext, onVolumeClick }) {
  return (
    <Box
      sx={{
        backgroundColor: '#008080', // Dark teal - matching screenshot
        width: '100%',
        padding: '12px 24px',
        display: 'flex',
        justifyContent: 'flex-end',
        alignItems: 'center',
        minHeight: '56px',
      }}
    >
      {/* Right side - Volume, Back, and Next buttons */}
      <Box sx={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
        <Button
          onClick={onVolumeClick}
          sx={{
            border: '1px solid white',
            backgroundColor: '#008080', // Dark teal fill
            color: 'white',
            borderRadius: '8px',
            padding: '8px 16px',
            textTransform: 'none',
            fontSize: '14px',
            fontWeight: 500,
            minWidth: 'auto',
            boxShadow: 'none',
            '&:hover': {
              backgroundColor: '#006666',
              boxShadow: 'none',
            },
          }}
          startIcon={<VolumeUpIcon sx={{ fontSize: '20px' }} />}
        >
          Volume
        </Button>
        <Button
          onClick={onPrevious}
          disabled={!canGoPrevious}
          sx={{
            border: '1px solid white',
            backgroundColor: '#008080', // Dark teal fill
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
            '&:disabled': {
              backgroundColor: '#004d4d',
              color: '#9e9e9e',
              borderColor: '#9e9e9e',
            },
          }}
          startIcon={<ChevronLeftIcon sx={{ fontSize: '20px' }} />}
        >
          Back
        </Button>
        <Button
          onClick={onNext}
          disabled={!canGoNext}
          sx={{
            border: '1px solid #008080', // Dark teal border
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
            '&:disabled': {
              backgroundColor: '#e0e0e0',
              color: '#9e9e9e',
              borderColor: '#9e9e9e',
            },
          }}
          endIcon={<ChevronRightIcon sx={{ fontSize: '20px' }} />}
        >
          Next
        </Button>
      </Box>
    </Box>
  )
}

export default TopNavigation

