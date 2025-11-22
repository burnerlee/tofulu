import { useState, useRef, useEffect } from 'react'
import { Box, Button, Slider, IconButton } from '@mui/material'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import VolumeUpIcon from '@mui/icons-material/VolumeUp'
import CloseIcon from '@mui/icons-material/Close'
import { useVolume } from '../contexts/VolumeContext'

function VolumeAdjustment({ onContinue }) {
  const { volume, setVolume } = useVolume()
  const [showVolumeControl, setShowVolumeControl] = useState(false)
  const volumeButtonRef = useRef(null)
  const popupRef = useRef(null)

  // Handle click outside to close popup
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        popupRef.current &&
        !popupRef.current.contains(event.target) &&
        volumeButtonRef.current &&
        !volumeButtonRef.current.contains(event.target)
      ) {
        setShowVolumeControl(false)
      }
    }

    if (showVolumeControl) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => {
        document.removeEventListener('mousedown', handleClickOutside)
      }
    }
  }, [showVolumeControl])

  const handleVolumeClick = () => {
    setShowVolumeControl(!showVolumeControl)
  }

  const handleVolumeChange = (event, newValue) => {
    setVolume(newValue)
    // Apply volume to any currently playing audio elements
    // This is a best-effort approach - individual components should also use the context
    const audioElements = document.querySelectorAll('audio')
    audioElements.forEach(audio => {
      audio.volume = newValue / 100
    })
  }

  const handleClosePopup = () => {
    setShowVolumeControl(false)
  }

  // Generate volume bars based on volume level
  const getVolumeBars = () => {
    const bars = []
    const numBars = 10
    const filledBars = Math.round((volume / 100) * numBars)
    
    for (let i = 0; i < numBars; i++) {
      const height = ((i + 1) / numBars) * 100 // Increasing height
      const isFilled = i < filledBars
      bars.push(
        <Box
          key={i}
          sx={{
            width: '4px',
            height: `${height}%`,
            backgroundColor: isFilled ? '#008080' : '#e0e0e0',
            borderRadius: '2px',
            transition: 'background-color 0.2s',
          }}
        />
      )
    }
    return bars
  }

  return (
    <Box className="min-h-screen bg-white flex flex-col relative">
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
        {/* Right side buttons */}
        <Box sx={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          {/* Volume button */}
          <Button
            ref={volumeButtonRef}
            onClick={handleVolumeClick}
            sx={{
              border: '1px solid white',
              backgroundColor: '#008080',
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
      </Box>

      {/* Volume Control Pop-up */}
      {showVolumeControl && (
        <Box
          ref={popupRef}
          sx={{
            position: 'absolute',
            top: '70px',
            right: '24px',
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '20px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            zIndex: 1000,
            minWidth: '200px',
          }}
        >
          {/* Close button */}
          <IconButton
            onClick={handleClosePopup}
            sx={{
              position: 'absolute',
              top: '8px',
              right: '8px',
              padding: '4px',
              color: '#666',
              '&:hover': {
                backgroundColor: '#f0f0f0',
              },
            }}
          >
            <CloseIcon sx={{ fontSize: '18px' }} />
          </IconButton>

          {/* Volume bars */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'center',
              gap: '3px',
              height: '60px',
              marginBottom: '16px',
              marginTop: '8px',
            }}
          >
            {getVolumeBars()}
          </Box>

          {/* Volume slider */}
          <Slider
            value={volume}
            onChange={handleVolumeChange}
            min={0}
            max={100}
            sx={{
              color: '#008080',
              '& .MuiSlider-thumb': {
                backgroundColor: '#008080',
                width: '18px',
                height: '18px',
                '&:hover': {
                  boxShadow: '0 0 0 8px rgba(0, 128, 128, 0.16)',
                },
              },
              '& .MuiSlider-track': {
                backgroundColor: '#008080',
                border: 'none',
              },
              '& .MuiSlider-rail': {
                backgroundColor: '#e0e0e0',
              },
            }}
          />
        </Box>
      )}

      {/* White content area */}
      <Box className="flex-1 flex flex-col items-center justify-start pt-16 px-8">
        {/* Content container with consistent width */}
        <Box className="w-full max-w-4xl flex flex-col items-center">
          {/* Centered title */}
          <h1 className="text-4xl font-normal text-gray-800 mb-6 text-center w-full">
            Adjusting the Volume
          </h1>

          {/* Instructions */}
          <Box className="w-full mb-8">
            <p className="text-base text-gray-800 leading-relaxed mb-4">
              To adjust the volume, select the Volume icon at the top of the screen. The volume control will appear. Move the volume indicator to the left or the right to change the volume.
            </p>
            <p className="text-base text-gray-800 leading-relaxed mb-4">
              To close the volume control, select the Volume icon again.
            </p>
            <p className="text-base text-gray-800 leading-relaxed">
              You will be able to change the volume during the test if you need to.
            </p>
          </Box>

          {/* Large teal speaker icon */}
          <Box
            sx={{
              marginTop: '32px',
              marginBottom: '32px',
            }}
          >
            <VolumeUpIcon
              sx={{
                fontSize: '120px',
                color: '#008080', // Teal color
              }}
            />
          </Box>

          {/* Final statement */}
          <Box className="w-full">
            <p className="text-base text-gray-800 leading-relaxed text-center">
              You now have the option to adjust the volume.
            </p>
          </Box>
        </Box>
      </Box>
    </Box>
  )
}

export default VolumeAdjustment

