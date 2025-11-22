import { useState, useEffect } from 'react'
import { Box, Button } from '@mui/material'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import MicIcon from '@mui/icons-material/Mic'
import HeadsetMicIcon from '@mui/icons-material/HeadsetMic'
import VolumeUpIcon from '@mui/icons-material/VolumeUp'

function HardwareCheck({ onContinue }) {
  const [microphonePermission, setMicrophonePermission] = useState(null)
  const [requesting, setRequesting] = useState(false)

  useEffect(() => {
    // Check microphone permission silently on mount
    checkMicrophonePermission()
  }, [])

  const checkMicrophonePermission = async () => {
    try {
      if (navigator.permissions && navigator.permissions.query) {
        try {
          const micPermission = await navigator.permissions.query({ name: 'microphone' })
          if (micPermission.state === 'granted') {
            setMicrophonePermission(true)
          } else if (micPermission.state === 'denied') {
            setMicrophonePermission(false)
          } else {
            setMicrophonePermission(null)
          }
        } catch (error) {
          // Permissions API might not support microphone in this browser
          setMicrophonePermission(null)
        }
      } else {
        setMicrophonePermission(null)
      }
    } catch (error) {
      console.error('Error checking microphone permission:', error)
      setMicrophonePermission(null)
    }
  }

  const requestMicrophonePermission = async () => {
    setRequesting(true)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      setMicrophonePermission(true)
      stream.getTracks().forEach(track => track.stop())
      return true
    } catch (error) {
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        setMicrophonePermission(false)
      } else {
        setMicrophonePermission(false)
      }
      return false
    } finally {
      setRequesting(false)
    }
  }

  const handleContinue = async () => {
    // If permission not granted, request it first
    if (microphonePermission !== true) {
      const granted = await requestMicrophonePermission()
      // After requesting, if permission is granted, proceed
      if (granted) {
        onContinue()
      }
    } else {
      onContinue()
    }
  }

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
          onClick={handleContinue}
          disabled={requesting}
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
            '&:disabled': {
              backgroundColor: '#f0f0f0',
              color: '#9e9e9e',
            },
          }}
          endIcon={<ArrowForwardIcon sx={{ fontSize: '18px' }} />}
        >
          Continue
        </Button>
      </Box>

      {/* White content area */}
      <Box className="flex-1 flex flex-col items-center justify-start pt-16 px-8">
        {/* Content container with consistent width */}
        <Box className="w-full max-w-4xl flex flex-col items-center">
          {/* Centered title */}
          <h1 className="text-4xl font-normal text-gray-800 mb-6 text-center w-full">
            Hardware Check
          </h1>

          {/* Horizontal line */}
          <Box
            sx={{
              width: '100%',
              height: '1px',
              backgroundColor: '#e0e0e0',
              marginBottom: '24px',
            }}
          />

          {/* Introductory text */}
          <Box className="w-full mb-12">
            <p className="text-base text-gray-800 leading-relaxed text-center">
              Before the test begins, we will check the microphone and headset volume.
            </p>
          </Box>

          {/* Three large teal icons arranged horizontally */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '64px',
              marginBottom: '32px',
              flexWrap: 'wrap',
              width: '100%',
            }}
          >
            {/* Microphone icon */}
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <MicIcon
                sx={{
                  fontSize: '80px',
                  color: '#008080', // Teal color
                }}
              />
            </Box>

            {/* Headset icon */}
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <HeadsetMicIcon
                sx={{
                  fontSize: '80px',
                  color: '#008080', // Teal color
                }}
              />
            </Box>

            {/* Speaker/Volume icon */}
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <VolumeUpIcon
                sx={{
                  fontSize: '80px',
                  color: '#008080', // Teal color
                }}
              />
            </Box>
          </Box>

          {/* Detailed instructions */}
          <Box className="w-full">
            <p className="text-base text-gray-800 leading-relaxed">
              Please make sure your headset is on. Follow the instructions on each screen. Be sure that your microphone is properly positioned and adjusted to allow for the best possible recording. Speak directly into the microphone and in your normal speaking voice.
            </p>
          </Box>
        </Box>

        {/* Microphone permission status and request button */}
        <Box className="w-full max-w-4xl mt-8">
          {microphonePermission === false && (
            <Box
              sx={{
                padding: '16px',
                backgroundColor: '#fff3cd',
                borderRadius: '8px',
                border: '1px solid #ffc107',
                width: '100%',
              }}
            >
              <p className="text-sm text-gray-800 mb-3">
                Microphone permission was denied. Please allow microphone access in your browser settings to continue.
              </p>
              <Button
                variant="outlined"
                onClick={requestMicrophonePermission}
                disabled={requesting}
                sx={{
                  textTransform: 'none',
                }}
              >
                {requesting ? 'Requesting...' : 'Request Microphone Permission'}
              </Button>
            </Box>
          )}

          {microphonePermission === null && !requesting && (
            <Box
              sx={{
                padding: '16px',
                backgroundColor: '#e3f2fd',
                borderRadius: '8px',
                border: '1px solid #2196f3',
                width: '100%',
              }}
            >
              <p className="text-sm text-gray-800 mb-3">
                Click Continue to request microphone permission. Your browser will prompt you to allow access.
              </p>
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  )
}

export default HardwareCheck

