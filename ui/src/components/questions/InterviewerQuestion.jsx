import { useState, useEffect, useRef } from 'react'
import { Box, Typography, Modal } from '@mui/material'
import MicIcon from '@mui/icons-material/Mic'
import MicOffIcon from '@mui/icons-material/MicOff'

function InterviewerQuestion({ bundle, assets, onNextChild, isParent, currentChildIndex }) {
  // State management
  const [isPlaying, setIsPlaying] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [timerSeconds, setTimerSeconds] = useState(10) // 10 seconds for InterviewerQuestion
  const [showBanner, setShowBanner] = useState(false)
  const [showTimer, setShowTimer] = useState(false)
  const [parentCompleted, setParentCompleted] = useState(false)
  
  // Refs
  const audioRef = useRef(null)
  const deepSoundRef = useRef(null)
  const mediaRecorderRef = useRef(null)
  const timerIntervalRef = useRef(null)
  const delayTimerRef = useRef(null)
  const handlersRef = useRef({ handleEnded: null, handleError: null })
  const hasAutoAdvancedRef = useRef(false)

  // Get current display based on isParent
  // Use InterviewerQuestions instead of childQuestions
  const currentChild = !isParent && bundle.InterviewerQuestions && bundle.InterviewerQuestions[currentChildIndex] ? bundle.InterviewerQuestions[currentChildIndex] : null
  const displayImageID = isParent ? bundle.displayImageID : (currentChild?.displayImageID)
  const audioAsset = isParent ? bundle.audioAsset : (currentChild?.audioAsset)
  const imageUrl = displayImageID && assets[displayImageID] ? assets[displayImageID] : null

  // Cleanup function
  const cleanup = () => {
    // Clean up audio
    if (audioRef.current) {
      const oldAudio = audioRef.current
      if (handlersRef.current.handleEnded) {
        oldAudio.removeEventListener('ended', handlersRef.current.handleEnded)
      }
      if (handlersRef.current.handleError) {
        oldAudio.removeEventListener('error', handlersRef.current.handleError)
      }
      oldAudio.pause()
      oldAudio.currentTime = 0
      audioRef.current = null
    }
    
    // Clean up deep sound
    if (deepSoundRef.current) {
      deepSoundRef.current.pause()
      deepSoundRef.current.currentTime = 0
      deepSoundRef.current = null
    }
    
    // Clean up timers
    if (delayTimerRef.current) {
      clearTimeout(delayTimerRef.current)
      delayTimerRef.current = null
    }
    
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current)
      timerIntervalRef.current = null
    }
    
    // Stop recording
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
      mediaRecorderRef.current = null
    }
  }

  // Play audio function
  const playAudio = (audioUrl, onComplete) => {
    cleanup()
    
    if (!audioUrl) {
      console.warn('No audio URL provided')
      if (onComplete) setTimeout(onComplete, 0)
      return
    }
    
    const audio = new Audio(audioUrl)
    audioRef.current = audio
    
    const handleEnded = () => {
      setIsPlaying(false)
      if (onComplete) {
        onComplete()
      }
    }
    
    const handleError = () => {
      console.error('Audio error occurred')
      setIsPlaying(false)
      if (onComplete) {
        onComplete()
      }
    }
    
    handlersRef.current.handleEnded = handleEnded
    handlersRef.current.handleError = handleError
    
    audio.addEventListener('ended', handleEnded)
    audio.addEventListener('error', handleError)
    
    setIsPlaying(true)
    audio.play().catch((error) => {
      console.error('Error playing audio:', error)
      setIsPlaying(false)
      if (onComplete) {
        onComplete()
      }
    })
  }

  // Play deep sound (beep sound)
  const playDeepSound = () => {
    // Use the beep sound asset from testData
    const beepSoundUrl = assets['beep-sound']
    if (beepSoundUrl) {
      try {
        // Clean up any existing beep sound
        if (deepSoundRef.current) {
          deepSoundRef.current.pause()
          deepSoundRef.current.currentTime = 0
        }
        const beepAudio = new Audio(beepSoundUrl)
        deepSoundRef.current = beepAudio
        beepAudio.play().catch((error) => {
          console.error('Error playing beep sound:', error)
        })
      } catch (error) {
        console.error('Error creating beep sound:', error)
      }
    } else {
      console.warn('Beep sound asset not found')
    }
  }

  // Start recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      const chunks = []
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data)
        }
      }
      
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' })
        // Here you would typically send the blob to a server
        console.log('Recording stopped, blob size:', blob.size)
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop())
      }
      
      mediaRecorderRef.current = mediaRecorder
      mediaRecorder.start()
      setIsRecording(true)
      
      // Start 10-second timer (instead of 8)
      setTimerSeconds(10)
      setShowTimer(true)
      let seconds = 10
      
      timerIntervalRef.current = setInterval(() => {
        seconds--
        setTimerSeconds(seconds)
        
        if (seconds <= 0) {
          clearInterval(timerIntervalRef.current)
          timerIntervalRef.current = null
          
          // Stop recording
          if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stop()
          }
          setIsRecording(false)
          setShowTimer(false)
          
          // Show banner
          setShowBanner(true)
          
          // After 2 seconds, move to next question
          delayTimerRef.current = setTimeout(() => {
            setShowBanner(false)
            if (onNextChild) {
              onNextChild()
            }
          }, 2000)
        }
      }, 1000)
    } catch (error) {
      console.error('Error starting recording:', error)
      setIsRecording(false)
      setShowTimer(false)
    }
  }

  // Reset state when switching between parent and children
  useEffect(() => {
    // Only reset if we're switching TO a child (not when showing parent)
    if (!isParent) {
      // Reset state when showing a child
      setShowBanner(false)
      setShowTimer(false)
      setIsRecording(false)
      setTimerSeconds(10) // 10 seconds for InterviewerQuestion
      
      // Clean up any running timers/recording
      if (delayTimerRef.current) {
        clearTimeout(delayTimerRef.current)
        delayTimerRef.current = null
      }
      
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current)
        timerIntervalRef.current = null
      }
      
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop()
        mediaRecorderRef.current = null
      }
    }
  }, [isParent, currentChildIndex])

  // Parent phase: show image, wait 2 seconds, play audio, wait 2 seconds, then auto-advance to first child
  useEffect(() => {
    if (isParent && bundle.audioAsset) {
      // Reset parent-specific state
      setParentCompleted(false)
      hasAutoAdvancedRef.current = false
      setIsPlaying(false)
      
      // Clean up any existing audio/timers
      if (audioRef.current) {
        const oldAudio = audioRef.current
        if (handlersRef.current.handleEnded) {
          oldAudio.removeEventListener('ended', handlersRef.current.handleEnded)
        }
        if (handlersRef.current.handleError) {
          oldAudio.removeEventListener('error', handlersRef.current.handleError)
        }
        oldAudio.pause()
        oldAudio.currentTime = 0
        audioRef.current = null
      }
      
      if (delayTimerRef.current) {
        clearTimeout(delayTimerRef.current)
        delayTimerRef.current = null
      }
      
      // Step 1: Wait 2 seconds before playing audio
      delayTimerRef.current = setTimeout(() => {
        // Step 2: Play parent audio
        const audio = new Audio(bundle.audioAsset)
        audioRef.current = audio
        
        const handleEnded = () => {
          setIsPlaying(false)
          setParentCompleted(true)
          // Step 3: After audio completes, wait 2 seconds then move to first child
          delayTimerRef.current = setTimeout(() => {
            hasAutoAdvancedRef.current = true
            if (onNextChild) {
              onNextChild() // This will move to child 0
            }
          }, 2000)
        }
        
        const handleError = () => {
          console.error('Audio error occurred')
          setIsPlaying(false)
          setParentCompleted(true)
          // Even on error, wait 2 seconds then move to first child
          delayTimerRef.current = setTimeout(() => {
            hasAutoAdvancedRef.current = true
            if (onNextChild) {
              onNextChild()
            }
          }, 2000)
        }
        
        handlersRef.current.handleEnded = handleEnded
        handlersRef.current.handleError = handleError
        
        audio.addEventListener('ended', handleEnded)
        audio.addEventListener('error', handleError)
        
        setIsPlaying(true)
        audio.play().catch((error) => {
          console.error('Error playing audio:', error)
          setIsPlaying(false)
          setParentCompleted(true)
          // Even on play error, wait 2 seconds then move to first child
          delayTimerRef.current = setTimeout(() => {
            hasAutoAdvancedRef.current = true
            if (onNextChild) {
              onNextChild()
            }
          }, 2000)
        })
      }, 2000) // 2 second delay before playing audio
    }
    
    return () => {
      // Cleanup on unmount or when isParent changes
      if (audioRef.current) {
        const oldAudio = audioRef.current
        if (handlersRef.current.handleEnded) {
          oldAudio.removeEventListener('ended', handlersRef.current.handleEnded)
        }
        if (handlersRef.current.handleError) {
          oldAudio.removeEventListener('error', handlersRef.current.handleError)
        }
        oldAudio.pause()
        oldAudio.currentTime = 0
        audioRef.current = null
      }
      
      if (delayTimerRef.current) {
        clearTimeout(delayTimerRef.current)
        delayTimerRef.current = null
      }
    }
  }, [isParent, bundle.audioAsset, onNextChild])

  // Child phase: handle child question sequence
  useEffect(() => {
    if (!isParent && currentChild) {
      // Reset state when child changes
      setShowBanner(false)
      setShowTimer(false)
      setIsRecording(false)
      setTimerSeconds(10) // 10 seconds for InterviewerQuestion
      
      // Clean up any existing timers
      if (delayTimerRef.current) {
        clearTimeout(delayTimerRef.current)
        delayTimerRef.current = null
      }
      
      // Step 1: Show screen (already shown via imageUrl)
      // Step 2: After 2 seconds, play audio
      delayTimerRef.current = setTimeout(() => {
        if (currentChild.audioAsset) {
          playAudio(currentChild.audioAsset, () => {
            // Step 3: After audio completes, wait 2 seconds
            delayTimerRef.current = setTimeout(() => {
              // Step 4: Play deep sound
              playDeepSound()
              
              // Step 5: Start recording and timer (after a brief delay for deep sound)
              setTimeout(() => {
                startRecording()
              }, 100)
            }, 2000)
          })
        }
      }, 2000)
    }
    
    return cleanup
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isParent, currentChild, currentChildIndex])

  // Format timer
  const formatTimer = (seconds) => {
    const hours = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
  }

  // Get instruction text
  const getInstructionText = () => {
    if (isParent) {
      return bundle.content || ""
    }
    return "Please answer the interviewer's questions." // Child questions show this instruction
  }

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-start',
        minHeight: '100%',
        position: 'relative',
        paddingTop: isParent ? '32px' : '32px',
        paddingBottom: '40px',
        width: '100%',
      }}
    >
      {/* Instruction text at top */}
      {getInstructionText() && (
        <Typography
          sx={{
            fontSize: isParent ? '22px' : '20px',
            fontWeight: 400,
            color: '#000000',
            textAlign: 'center',
            marginBottom: isParent ? '40px' : '40px',
            padding: '0 32px',
            lineHeight: 1.6,
            maxWidth: '1000px',
            width: '100%',
          }}
        >
          {getInstructionText()}
        </Typography>
      )}

      {/* Main image - same size for parent and child */}
      {imageUrl && (
        <Box
          component="img"
          src={imageUrl}
          alt="Question image"
          sx={{
            width: '600px',
            height: '450px',
            maxWidth: '90vw',
            maxHeight: '50vh',
            objectFit: 'contain',
            display: 'block',
          }}
        />
      )}

      {/* Timer at bottom (when recording) */}
      {showTimer && (
        <Box
          sx={{
            position: 'fixed',
            bottom: '16px',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: '#424242',
            borderRadius: '8px',
            padding: '12px 24px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            zIndex: 1000,
          }}
        >
          <Typography
            sx={{
              fontSize: '14px',
              fontWeight: 500,
              color: '#ffffff',
              textTransform: 'uppercase',
            }}
          >
            Response Time
          </Typography>
          {isRecording ? (
            <MicIcon sx={{ color: '#4caf50', fontSize: '24px' }} />
          ) : (
            <MicOffIcon sx={{ color: '#ffffff', fontSize: '24px' }} />
          )}
          <Typography
            sx={{
              fontSize: '18px',
              fontWeight: 500,
              color: '#ffffff',
              fontFamily: 'monospace',
            }}
          >
            {formatTimer(timerSeconds)}
          </Typography>
        </Box>
      )}

      {/* Response saved banner */}
      <Modal
        open={showBanner}
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Box
          sx={{
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '32px',
            maxWidth: '500px',
            textAlign: 'center',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
          }}
        >
          <Typography
            sx={{
              fontSize: '18px',
              fontWeight: 500,
              color: '#000000',
              marginBottom: '8px',
            }}
          >
            Stop Speaking
          </Typography>
          <Typography
            sx={{
              fontSize: '16px',
              fontWeight: 400,
              color: '#666666',
              marginBottom: '8px',
            }}
          >
            Response time has ended.
          </Typography>
          <Typography
            sx={{
              fontSize: '16px',
              fontWeight: 400,
              color: '#666666',
            }}
          >
            Please wait. We are currently saving your response.
          </Typography>
        </Box>
      </Modal>
    </Box>
  )
}

export default InterviewerQuestion

