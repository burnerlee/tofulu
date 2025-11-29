import { useEffect, useRef } from 'react'
import { Box, Typography, Divider, Button } from '@mui/material'
import { useVolume } from '../contexts/VolumeContext'
import listeningModuleIntroAudio from '../audios/listeningModuleIntro.mp3'

// Task type name mapping for module start (listening section)
const listeningTaskTypeNames = {
  'bestresponse': 'Listen and Choose a Response',
  'listenpassage': 'Listen to a Passage'
}

function ModuleStart({ moduleNumber, sectionName, section, module, onContinue }) {
  const { getVolumeDecimal } = useVolume()
  const audioRef = useRef(null)
  
  // Get first task type for listening section
  const firstTaskType = section === 'listening' && module?.questions?.[0] 
    ? listeningTaskTypeNames[module.questions[0].type] || 'task'
    : null

  // Initialize and play audio for listening section
  useEffect(() => {
    if (section === 'listening') {
      const audio = new Audio(listeningModuleIntroAudio)
      audio.volume = getVolumeDecimal()
      audio.loop = false
      audioRef.current = audio

      // Play audio after 1 second delay
      const startTimer = setTimeout(() => {
        if (audioRef.current) {
          audioRef.current.play().catch(error => {
            console.error('Error playing audio:', error)
          })
        }
      }, 1000)

      // Cleanup on unmount
      return () => {
        clearTimeout(startTimer)
        if (audioRef.current) {
          audioRef.current.pause()
          audioRef.current.currentTime = 0
          audioRef.current = null
        }
      }
    }
  }, [section, getVolumeDecimal])

  // Update audio volume when volume changes
  useEffect(() => {
    if (section === 'listening' && audioRef.current) {
      audioRef.current.volume = getVolumeDecimal()
    }
  }, [section, getVolumeDecimal])

  // Stop audio when continuing
  const handleContinue = () => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
    }
    onContinue()
  }
  return (
    <Box className="min-h-screen bg-white">
      {/* Top Navigation Bar with Begin button */}
      <Box
        sx={{
          backgroundColor: '#008080',
          width: '100%',
          padding: '12px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          minHeight: '56px',
        }}
      >
        <Typography
          sx={{
            fontSize: '16px',
            fontWeight: 400,
            color: '#ffffff',
            fontFamily: 'inherit',
          }}
        >
          {sectionName}
        </Typography>
        <Button
          onClick={handleContinue}
          sx={{
            border: '1px solid white',
            backgroundColor: '#008080',
            color: 'white',
            borderRadius: '8px',
            padding: '8px 24px',
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
        >
          Begin
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
          Module {moduleNumber}
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
          {section === 'listening' ? (
            <>
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
                In an actual test, the clock will show you how much time you have to complete each question.
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
                You can use Next to move to the next question.
              </Typography>
              {firstTaskType && (
                <Typography
                  sx={{
                    fontSize: '16px',
                    fontWeight: 400,
                    color: '#424242',
                    lineHeight: 1.6,
                    fontFamily: 'inherit',
                  }}
                >
                  The first task is {firstTaskType}. {firstTaskType === 'Listen and Choose a Response' 
                    ? 'In this task, you will listen to a sentence or question. You will then read four sentences and choose the option that is the best response.'
                    : 'In this task, you will listen to a passage and answer questions about it.'}
                </Typography>
              )}
            </>
          ) : (
            <>
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
                In an actual test, the clock will show you how much time you have to complete Module {moduleNumber}.
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
                In an actual test, you{' '}
                <Box component="span" sx={{ fontWeight: 700 }}>
                  WILL NOT
                </Box>{' '}
                be able to return to Module {moduleNumber} once you have begun Module {moduleNumber + 1}.
              </Typography>
            </>
          )}
        </Box>
      </Box>
    </Box>
  )
}

export default ModuleStart
