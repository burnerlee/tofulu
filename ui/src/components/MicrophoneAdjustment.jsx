import { useState, useEffect, useRef } from 'react'
import { Box, Button, IconButton, CircularProgress, Slider } from '@mui/material'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import VolumeUpIcon from '@mui/icons-material/VolumeUp'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import CancelIcon from '@mui/icons-material/Cancel'
import MicIcon from '@mui/icons-material/Mic'
import CloseIcon from '@mui/icons-material/Close'
import { useVolume } from '../contexts/VolumeContext'

function MicrophoneAdjustment({ onContinue }) {
  const { volume, setVolume } = useVolume()
  const [showVolumeControl, setShowVolumeControl] = useState(false)
  const [microphoneLevel, setMicrophoneLevel] = useState(0) // 0-15 for 15 bars
  const [volumeStatus, setVolumeStatus] = useState(null) // 'good', 'too-loud', 'too-quiet'
  const [showRecordingPopup, setShowRecordingPopup] = useState(false)
  const [showSuccessPopup, setShowSuccessPopup] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [countdown, setCountdown] = useState(null) // 3, 2, 1 countdown
  const [recordingTime, setRecordingTime] = useState(0) // 0-10 seconds
  const [recordingLevel, setRecordingLevel] = useState(0) // Live level during recording
  const [micConfigured, setMicConfigured] = useState(false) // Track if mic configuration is complete
  const audioContextRef = useRef(null)
  const analyserRef = useRef(null)
  const microphoneRef = useRef(null)
  const streamRef = useRef(null)
  const animationFrameRef = useRef(null)
  const popupTimerRef = useRef(null)
  const countdownTimerRef = useRef(null)
  const recordingTimerRef = useRef(null)
  const volumeButtonRef = useRef(null)
  const popupRef = useRef(null)
  const isRecordingRef = useRef(false)

  useEffect(() => {
    // Set timer for popup after 5 seconds
    popupTimerRef.current = setTimeout(() => {
      setShowRecordingPopup(true)
    }, 5000)

    return () => {
      // Cleanup
      stopMicrophoneMonitoring()
      if (popupTimerRef.current) {
        clearTimeout(popupTimerRef.current)
      }
      if (countdownTimerRef.current) {
        clearInterval(countdownTimerRef.current)
      }
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current)
      }
    }
  }, [])

  // Handle click outside volume popup
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

  const startMicrophoneMonitoring = async () => {
    try {
      // Stop any existing stream first
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
      }
      if (audioContextRef.current) {
        await audioContextRef.current.close().catch(console.error)
      }
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      
      // Create audio context
      const audioContext = new (window.AudioContext || window.webkitAudioContext)()
      
      // Resume audio context if suspended (required in some browsers)
      if (audioContext.state === 'suspended') {
        await audioContext.resume()
      }
      
      const analyser = audioContext.createAnalyser()
      const microphone = audioContext.createMediaStreamSource(stream)
      
      analyser.fftSize = 256
      analyser.smoothingTimeConstant = 0.3 // Lower for more responsive updates
      
      microphone.connect(analyser)
      
      audioContextRef.current = audioContext
      analyserRef.current = analyser
      microphoneRef.current = microphone
      streamRef.current = stream
      
      console.log('Microphone monitoring started, audio context state:', audioContext.state)
    } catch (error) {
      console.error('Error accessing microphone:', error)
    }
  }

  const analyzeAudioLevel = () => {
    if (!analyserRef.current || !isRecordingRef.current) {
      return
    }

    // Use time domain data for more accurate microphone input level
    const bufferLength = analyserRef.current.frequencyBinCount
    const dataArray = new Uint8Array(bufferLength)
    analyserRef.current.getByteTimeDomainData(dataArray)
    
    // Calculate RMS (Root Mean Square) for better volume representation
    let sumSquares = 0
    let maxAmplitude = 0
    
    for (let i = 0; i < bufferLength; i++) {
      const normalized = (dataArray[i] - 128) / 128 // Normalize to -1 to 1
      const absValue = Math.abs(normalized)
      sumSquares += normalized * normalized
      maxAmplitude = Math.max(maxAmplitude, absValue)
    }
    
    const rms = Math.sqrt(sumSquares / bufferLength)
    
    // Use both RMS and peak amplitude for better visualization
    // Combine them with more weight on peak for responsiveness
    const combined = (rms * 0.7 + maxAmplitude * 0.3)
    
    // Convert to 0-15 range for 15 bars with higher sensitivity
    const amplified = combined * 40 // Increased sensitivity
    const normalizedLevel = Math.min(15, Math.max(0, Math.round(amplified)))
    
    setRecordingLevel(normalizedLevel)
    
    // Continue analyzing - keep the loop running as long as recording
    if (isRecordingRef.current) {
      animationFrameRef.current = requestAnimationFrame(analyzeAudioLevel)
    }
  }

  const handleRecordClick = async () => {
    // Start countdown
    setCountdown(3)
    let count = 3
    
    countdownTimerRef.current = setInterval(() => {
      count--
      setCountdown(count)
      
      if (count <= 0) {
        clearInterval(countdownTimerRef.current)
        setCountdown(null)
        startRecording()
      }
    }, 1000)
  }

  const startRecording = async () => {
    setIsRecording(true)
    isRecordingRef.current = true
    setRecordingTime(0)
    setRecordingLevel(0) // Reset level
    
    // Start microphone monitoring
    await startMicrophoneMonitoring()
    
    // Small delay to ensure audio context is ready, then start analysis
    setTimeout(() => {
      // Start analyzing audio - this will keep running via requestAnimationFrame
      if (analyserRef.current && isRecordingRef.current) {
        analyzeAudioLevel()
      }
    }, 200)
    
    // Start 10-second recording timer
    let time = 0
    recordingTimerRef.current = setInterval(() => {
      time++
      setRecordingTime(time)
      
      if (time >= 10) {
        // Recording complete
        stopRecording()
        setShowRecordingPopup(false)
        setShowSuccessPopup(true)
        setMicConfigured(true) // Mark mic as configured
      }
    }, 1000)
  }

  const stopRecording = () => {
    setIsRecording(false)
    isRecordingRef.current = false
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current)
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
    }
    stopMicrophoneMonitoring()
  }

  const stopMicrophoneMonitoring = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(console.error)
      audioContextRef.current = null
    }
    analyserRef.current = null
    microphoneRef.current = null
  }

  const handleVolumeClick = () => {
    setShowVolumeControl(!showVolumeControl)
  }

  const handleVolumeChange = (event, newValue) => {
    setVolume(newValue)
    // Apply volume to any currently playing audio elements
    const audioElements = document.querySelectorAll('audio')
    audioElements.forEach(audio => {
      audio.volume = newValue / 100
    })
  }

  const handleSuccessContinue = () => {
    setShowSuccessPopup(false)
    onContinue()
  }

  // Generate volume bars for volume control popup
  const getVolumeBars = () => {
    const bars = []
    const numBars = 10
    const filledBars = Math.round((volume / 100) * numBars)
    
    for (let i = 0; i < numBars; i++) {
      const height = ((i + 1) / numBars) * 100
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

  // Generate bars for volume visualization
  const generateBars = (level, isExample = false, exampleType = 'good') => {
    const bars = []
    for (let i = 0; i < 15; i++) {
      const isFilled = isExample 
        ? (exampleType === 'good' ? i < 10 : i < 14) // Good: first 10, Too Loud: first 14
        : i < level
      
      const color = isExample
        ? (exampleType === 'good' ? '#008080' : '#d32f2f') // Teal for good, red for too loud
        : volumeStatus === 'too-loud' 
          ? '#d32f2f' 
          : volumeStatus === 'too-quiet'
            ? '#ff9800'
            : '#008080'
      
      bars.push(
        <Box
          key={i}
          sx={{
            width: '20px',
            height: `${((i + 1) / 15) * 100}%`,
            minHeight: '20px',
            backgroundColor: isFilled ? color : 'transparent',
            border: `2px solid ${isFilled ? color : '#e0e0e0'}`,
            borderRadius: '2px',
            transition: 'all 0.1s ease',
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
          backgroundColor: '#008080',
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
            disabled={!micConfigured}
            sx={{
              backgroundColor: micConfigured ? '#e0e0e0' : '#f0f0f0',
              color: micConfigured ? '#424242' : '#9e9e9e',
              borderRadius: '8px',
              padding: '8px 16px',
              textTransform: 'none',
              fontSize: '14px',
              fontWeight: 500,
              minWidth: 'auto',
              boxShadow: 'none',
              '&:hover': {
                backgroundColor: micConfigured ? '#d0d0d0' : '#f0f0f0',
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
      </Box>

      {/* White content area */}
      <Box className="flex-1 flex flex-col items-center justify-start pt-16 px-8">
        {/* Content container with consistent width */}
        <Box className="w-full max-w-4xl flex flex-col">
          {/* Centered title */}
          <h1 className="text-4xl font-normal text-gray-800 mb-6 text-center w-full">
            Adjusting the Microphone
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

          {/* Instructions */}
          <Box className="w-full mb-8">
            <p className="text-base text-gray-800 leading-relaxed">
              In order to check your microphone volume, you will speak into the microphone using your normal tone and volume. For best recording results, your voice level should remain generally within the Good Range. While you speak the microphone will adjust automatically.
            </p>
          </Box>

          {/* Examples Section */}
          <Box className="w-full mb-8">
            <p className="text-base font-semibold text-gray-800 mb-4">Example:</p>
            
            {/* Two diagrams side by side */}
            <Box
              sx={{
                display: 'flex',
                gap: '32px',
                justifyContent: 'center',
                flexWrap: 'wrap',
              }}
            >
              {/* Good Volume Example */}
              <Box sx={{ flex: '1', minWidth: '300px', maxWidth: '400px' }}>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'flex-end',
                    justifyContent: 'center',
                    gap: '4px',
                    height: '120px',
                    marginBottom: '8px',
                  }}
                >
                  {generateBars(10, true, 'good')}
                </Box>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    paddingX: '8px',
                  }}
                >
                  <Box
                    sx={{
                      width: '33%',
                      height: '1px',
                      borderTop: '1px dashed #ccc',
                      position: 'relative',
                    }}
                  >
                    <Box
                      sx={{
                        position: 'absolute',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        top: '8px',
                        fontSize: '12px',
                        color: '#666',
                      }}
                    >
                      Too Quiet
                    </Box>
                  </Box>
                  <Box
                    sx={{
                      width: '33%',
                      height: '1px',
                      borderTop: '1px dashed #ccc',
                      position: 'relative',
                    }}
                  >
                    <Box
                      sx={{
                        position: 'absolute',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        top: '8px',
                        fontSize: '12px',
                        color: '#666',
                      }}
                    >
                      Good
                    </Box>
                  </Box>
                  <Box
                    sx={{
                      width: '33%',
                      height: '1px',
                      borderTop: '1px dashed #ccc',
                      position: 'relative',
                    }}
                  >
                    <Box
                      sx={{
                        position: 'absolute',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        top: '8px',
                        fontSize: '12px',
                        color: '#666',
                      }}
                    >
                      Too Loud
                    </Box>
                  </Box>
                </Box>
              </Box>

              {/* Too Loud Example */}
              <Box sx={{ flex: '1', minWidth: '300px', maxWidth: '400px' }}>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'flex-end',
                    justifyContent: 'center',
                    gap: '4px',
                    height: '120px',
                    marginBottom: '8px',
                  }}
                >
                  {generateBars(14, true, 'too-loud')}
                </Box>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    paddingX: '8px',
                  }}
                >
                  <Box
                    sx={{
                      width: '33%',
                      height: '1px',
                      borderTop: '1px dashed #ccc',
                      position: 'relative',
                    }}
                  >
                    <Box
                      sx={{
                        position: 'absolute',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        top: '8px',
                        fontSize: '12px',
                        color: '#666',
                      }}
                    >
                      Too Quiet
                    </Box>
                  </Box>
                  <Box
                    sx={{
                      width: '33%',
                      height: '1px',
                      borderTop: '1px dashed #ccc',
                      position: 'relative',
                    }}
                  >
                    <Box
                      sx={{
                        position: 'absolute',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        top: '8px',
                        fontSize: '12px',
                        color: '#666',
                      }}
                    >
                      Good
                    </Box>
                  </Box>
                  <Box
                    sx={{
                      width: '33%',
                      height: '1px',
                      borderTop: '1px dashed #ccc',
                      position: 'relative',
                    }}
                  >
                    <Box
                      sx={{
                        position: 'absolute',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        top: '8px',
                        fontSize: '12px',
                        color: '#666',
                      }}
                    >
                      Too Loud
                    </Box>
                  </Box>
                </Box>
              </Box>
            </Box>
          </Box>

          {/* Feedback Indicators */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              gap: '64px',
              marginTop: '32px',
              flexWrap: 'wrap',
            }}
          >
            {/* Good Indicator */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
              }}
            >
              <CheckCircleIcon
                sx={{
                  fontSize: '48px',
                  color: '#4caf50',
                }}
              />
              <Box
                component="span"
                sx={{
                  fontSize: '24px',
                  fontWeight: 500,
                  color: '#424242',
                }}
              >
                Good
              </Box>
            </Box>

            {/* Too Loud Indicator */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
              }}
            >
              <CancelIcon
                sx={{
                  fontSize: '48px',
                  color: '#d32f2f',
                }}
              />
              <Box
                component="span"
                sx={{
                  fontSize: '24px',
                  fontWeight: 500,
                  color: '#424242',
                }}
              >
                Too Loud
              </Box>
            </Box>
          </Box>

          {/* Real-time microphone level visualization (hidden by default, can be enabled for testing) */}
          {false && microphoneLevel > 0 && (
            <Box className="w-full mt-8">
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'flex-end',
                  justifyContent: 'center',
                  gap: '4px',
                  height: '120px',
                  marginBottom: '8px',
                }}
              >
                {generateBars(microphoneLevel)}
              </Box>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingX: '8px',
                }}
              >
                <Box
                  sx={{
                    width: '33%',
                    height: '1px',
                    borderTop: '1px dashed #ccc',
                    position: 'relative',
                  }}
                >
                  <Box
                    sx={{
                      position: 'absolute',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      top: '8px',
                      fontSize: '12px',
                      color: '#666',
                    }}
                  >
                    Too Quiet
                  </Box>
                </Box>
                <Box
                  sx={{
                    width: '33%',
                    height: '1px',
                    borderTop: '1px dashed #ccc',
                    position: 'relative',
                  }}
                >
                  <Box
                    sx={{
                      position: 'absolute',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      top: '8px',
                      fontSize: '12px',
                      color: '#666',
                    }}
                  >
                    Good
                  </Box>
                </Box>
                <Box
                  sx={{
                    width: '33%',
                    height: '1px',
                    borderTop: '1px dashed #ccc',
                    position: 'relative',
                  }}
                >
                  <Box
                    sx={{
                      position: 'absolute',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      top: '8px',
                      fontSize: '12px',
                      color: '#666',
                    }}
                  >
                    Too Loud
                  </Box>
                </Box>
              </Box>
            </Box>
          )}
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
          <IconButton
            onClick={() => setShowVolumeControl(false)}
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

      {/* Recording Popup */}
      {showRecordingPopup && (
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000,
            padding: '20px',
          }}
        >
          <Box
            sx={{
              backgroundColor: 'white',
              borderRadius: '12px',
              padding: '32px',
              maxWidth: '800px',
              width: '100%',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2)',
            }}
          >
            <Box
              sx={{
                display: 'flex',
                gap: '32px',
                alignItems: 'flex-start',
                flexWrap: 'wrap',
              }}
            >
              {/* Left: Record Button */}
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  minWidth: '200px',
                }}
              >
                <Button
                  onClick={handleRecordClick}
                  disabled={isRecording || countdown !== null}
                  sx={{
                    width: '120px',
                    height: '120px',
                    borderRadius: '50%',
                    backgroundColor: '#008080',
                    color: 'white',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    textTransform: 'none',
                    fontSize: '14px',
                    fontWeight: 600,
                    '&:hover': {
                      backgroundColor: '#006666',
                    },
                    '&:disabled': {
                      backgroundColor: '#008080',
                      opacity: 0.8,
                    },
                    position: 'relative',
                  }}
                >
                  {isRecording && (
                    <CircularProgress
                      variant="determinate"
                      value={(recordingTime / 10) * 100}
                      sx={{
                        position: 'absolute',
                        color: 'white',
                        '& .MuiCircularProgress-circle': {
                          strokeLinecap: 'round',
                        },
                      }}
                      size={120}
                      thickness={4}
                    />
                  )}
                  <MicIcon sx={{ fontSize: '40px', zIndex: 1 }} />
                  <Box component="span" sx={{ zIndex: 1 }}>
                    {countdown !== null ? countdown : isRecording ? 'RECORDING' : 'RECORD'}
                  </Box>
                </Button>
              </Box>

              {/* Right: Instructions and Text */}
              <Box sx={{ flex: 1, minWidth: '300px' }}>
                <Box sx={{ marginBottom: '16px' }}>
                  <p className="text-base text-gray-800 leading-relaxed mb-2">
                    Select the 'Record' button. A timer will count down until the system is ready to record.
                  </p>
                  <p className="text-base text-gray-800 leading-relaxed mb-4">
                    To check your microphone level, you will record the following paragraph using your normal tone and volume.
                  </p>
                  <p className="text-base text-gray-800 leading-relaxed italic">
                    "There are several reasons why I would prefer to live in a large city. Some of the greatest advantages would include the number of job opportunities and career options, public transportation, greater diversity, and a wealth of entertainment. Also, large cities typically have a great deal to offer in terms of history, art and culture."
                  </p>
                </Box>

                {/* Microphone Level Indicator */}
                <Box sx={{ marginTop: '24px' }}>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'flex-end',
                      justifyContent: 'center',
                      gap: '4px',
                      height: '80px',
                      marginBottom: '8px',
                    }}
                  >
                    {Array.from({ length: 15 }, (_, i) => {
                      const isFilled = i < recordingLevel
                      let color = '#e0e0e0'
                      if (isFilled) {
                        if (i < 5) {
                          color = '#ff9800' // Yellow/Orange for Too Quiet
                        } else if (i < 10) {
                          color = '#008080' // Teal for Good
                        } else {
                          color = '#d32f2f' // Red for Too Loud
                        }
                      }
                      return (
                        <Box
                          key={i}
                          sx={{
                            width: '20px',
                            height: `${((i + 1) / 15) * 100}%`,
                            minHeight: '20px',
                            backgroundColor: isFilled ? color : 'transparent',
                            border: `2px solid ${isFilled ? color : '#e0e0e0'}`,
                            borderRadius: '2px',
                            transition: 'all 0.1s ease',
                          }}
                        />
                      )
                    })}
                  </Box>
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      paddingX: '8px',
                      position: 'relative',
                    }}
                  >
                    <Box
                      sx={{
                        width: '33%',
                        height: '1px',
                        borderTop: '1px dashed #ccc',
                        position: 'relative',
                      }}
                    >
                      <Box
                        sx={{
                          position: 'absolute',
                          left: '50%',
                          transform: 'translateX(-50%)',
                          top: '8px',
                          fontSize: '12px',
                          color: '#666',
                        }}
                      >
                        Too Quiet
                      </Box>
                    </Box>
                    <Box
                      sx={{
                        width: '33%',
                        height: '1px',
                        borderTop: '1px dashed #ccc',
                        position: 'relative',
                        backgroundColor: '#f5f5f5',
                        paddingY: '4px',
                      }}
                    >
                      <Box
                        sx={{
                          position: 'absolute',
                          left: '50%',
                          transform: 'translateX(-50%)',
                          top: '8px',
                          fontSize: '12px',
                          color: '#666',
                        }}
                      >
                        Good
                      </Box>
                    </Box>
                    <Box
                      sx={{
                        width: '33%',
                        height: '1px',
                        borderTop: '1px dashed #ccc',
                        position: 'relative',
                      }}
                    >
                      <Box
                        sx={{
                          position: 'absolute',
                          left: '50%',
                          transform: 'translateX(-50%)',
                          top: '8px',
                          fontSize: '12px',
                          color: '#666',
                        }}
                      >
                        Too Loud
                      </Box>
                    </Box>
                  </Box>
                </Box>
              </Box>
            </Box>
          </Box>
        </Box>
      )}

      {/* Success Popup */}
      {showSuccessPopup && (
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000,
            padding: '20px',
          }}
        >
          <Box
            sx={{
              backgroundColor: 'white',
              borderRadius: '12px',
              padding: '32px',
              maxWidth: '500px',
              width: '100%',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2)',
              textAlign: 'center',
            }}
          >
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px',
                marginBottom: '16px',
              }}
            >
              <CheckCircleIcon
                sx={{
                  fontSize: '48px',
                  color: '#4caf50',
                }}
              />
              <Box
                component="h2"
                sx={{
                  fontSize: '24px',
                  fontWeight: 700,
                  color: '#424242',
                  margin: 0,
                }}
              >
                Success
              </Box>
            </Box>
            <p className="text-base text-gray-800 mb-6">
              Your microphone volume has been successfully adjusted.
            </p>
            <Button
              onClick={handleSuccessContinue}
              sx={{
                backgroundColor: '#008080',
                color: 'white',
                borderRadius: '8px',
                padding: '10px 24px',
                textTransform: 'none',
                fontSize: '16px',
                fontWeight: 500,
                border: '1px solid white',
                '&:hover': {
                  backgroundColor: '#006666',
                },
              }}
            >
              Continue
            </Button>
          </Box>
        </Box>
      )}
    </Box>
  )
}

export default MicrophoneAdjustment

