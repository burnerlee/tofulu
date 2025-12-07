import { useState, useEffect, useRef } from 'react'
import { Box, Typography, Radio, RadioGroup, FormControlLabel, FormControl, Button } from '@mui/material'
import RefreshIcon from '@mui/icons-material/Refresh'
import { useVolume } from '../../contexts/VolumeContext'
import { resolveAudioReference, resolveAssetReference } from '../../utils/assetResolver'

function BestResponseQuestion({ bundle, question, assets, assetReferencesResolved = [], userAnswers, onAnswerChange }) {
  const { getVolumeDecimal } = useVolume()
  const [optionsEnabled, setOptionsEnabled] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const audioRef = useRef(null)
  const delayTimerRef = useRef(null)
  const handlersRef = useRef({ handleEnded: null, handleError: null })
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const hasPlayedRef = useRef(false)
  const currentQuestionIdRef = useRef(null)
  const timeoutSetRef = useRef(false)

  const startAudioPlayback = () => {
    // Clean up any existing audio and timers
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

    // Reset state
    setOptionsEnabled(false)
    setIsPlaying(false)
    
    // Resolve audioReference to URL
    const audioUrl = question.audioReference 
      ? resolveAudioReference(question.audioReference, assetReferencesResolved)
      : (question.audioUrl || null) // Fallback to old format for backward compatibility
    
    if (!audioUrl) {
      console.error('No audio URL available for question:', question.id)
      setOptionsEnabled(true)
      setIsPlaying(false)
      return
    }
    
    // Create audio element
    const audio = new Audio(audioUrl)
    audio.volume = getVolumeDecimal() // Apply volume setting
    audioRef.current = audio

    // Handle audio end
    const handleEnded = () => {
      setOptionsEnabled(true)
      setIsPlaying(false)
    }

    // Handle audio errors
    const handleError = () => {
      console.error('Audio error occurred')
      setOptionsEnabled(true)
      setIsPlaying(false)
    }

    // Store handlers for cleanup
    handlersRef.current.handleEnded = handleEnded
    handlersRef.current.handleError = handleError

    audio.addEventListener('ended', handleEnded)
    audio.addEventListener('error', handleError)

    // Wait 2 seconds, then play audio
    delayTimerRef.current = setTimeout(() => {
      setIsPlaying(true)
      audio.play().catch((error) => {
        console.error('Error playing audio:', error)
        // If audio fails to play, enable options anyway
        setOptionsEnabled(true)
        setIsPlaying(false)
      })
    }, 2000)
  }

  useEffect(() => {
    console.log('[BestResponseQuestion] useEffect triggered', {
      questionId: question.id,
      currentQuestionIdRef: currentQuestionIdRef.current,
      hasPlayedRef: hasPlayedRef.current,
      refreshTrigger,
      audioReference: question.audioReference
    })
    
    // Reset hasPlayed flag when question changes (not on refresh)
    const isNewQuestion = currentQuestionIdRef.current !== question.id
    console.log('[BestResponseQuestion] isNewQuestion:', isNewQuestion)
    
    if (isNewQuestion) {
      console.log('[BestResponseQuestion] Resetting hasPlayed flag for new question')
      hasPlayedRef.current = false
      currentQuestionIdRef.current = question.id
      timeoutSetRef.current = false
    }
    
    // Reset timeout flag when refresh is triggered
    if (refreshTrigger > 0) {
      console.log('[BestResponseQuestion] Refresh triggered, resetting flags')
      hasPlayedRef.current = false
      timeoutSetRef.current = false
    }
    
    // Play audio if:
    // 1. It's a new question (first time seeing this question) - this includes first load
    // 2. Refresh was triggered
    const shouldPlay = isNewQuestion || refreshTrigger > 0
    console.log('[BestResponseQuestion] shouldPlay:', shouldPlay, { isNewQuestion, refreshTrigger })
    
    if (shouldPlay) {
      console.log('[BestResponseQuestion] Starting audio playback')
      // Clean up any existing audio and timers
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
        console.log('[BestResponseQuestion] Clearing existing timeout before refresh')
        clearTimeout(delayTimerRef.current)
        delayTimerRef.current = null
      }

      // Reset state
      setOptionsEnabled(false)
      setIsPlaying(false)
      
      // Reset timeout flag to allow new timeout to be set
      timeoutSetRef.current = false
      
      // Create audio element
      const audio = new Audio(question.audioUrl || 'https://cdn.pixabay.com/download/audio/2022/03/15/audio_1c15910a47.mp3?filename=this-doesnt-smell-87209.mp3')
      audioRef.current = audio

      // Handle audio end
      const handleEnded = () => {
        console.log('[BestResponseQuestion] Audio ended event fired')
        setOptionsEnabled(true)
        setIsPlaying(false)
        console.log('[BestResponseQuestion] Options enabled after audio ended')
      }

      // Handle audio errors
      const handleError = () => {
        console.error('Audio error occurred')
        setOptionsEnabled(true)
        setIsPlaying(false)
      }

      // Store handlers for cleanup
      handlersRef.current.handleEnded = handleEnded
      handlersRef.current.handleError = handleError

      audio.addEventListener('ended', handleEnded)
      audio.addEventListener('error', handleError)

      // Wait 2 seconds, then play audio
      // Only set timeout if we haven't already set it for this question
      if (!timeoutSetRef.current) {
        console.log('[BestResponseQuestion] Setting timeout to play audio in 2 seconds')
        timeoutSetRef.current = true
        delayTimerRef.current = setTimeout(() => {
          console.log('[BestResponseQuestion] Timeout fired, attempting to play audio')
          setIsPlaying(true)
          const currentAudio = audioRef.current
          if (currentAudio) {
            currentAudio.play().then(() => {
              console.log('[BestResponseQuestion] Audio play() promise resolved - audio is playing')
            }).catch((error) => {
              console.error('[BestResponseQuestion] Error playing audio:', error)
              // If audio fails to play, enable options anyway
              setOptionsEnabled(true)
              setIsPlaying(false)
            })
          } else {
            console.warn('[BestResponseQuestion] Audio ref is null when timeout fired')
          }
        }, 2000)
      } else {
        console.log('[BestResponseQuestion] Timeout already set, skipping')
      }
      
      hasPlayedRef.current = true
      console.log('[BestResponseQuestion] Set hasPlayedRef to true')
    } else {
      console.log('[BestResponseQuestion] Not playing audio - conditions not met')
    }

    // Cleanup - only clean up if question actually changed
    return () => {
      // Store the question ID at cleanup time to check if it's still the same
      const questionIdAtCleanup = question.id
      const timeoutId = delayTimerRef.current
      const audioToCleanup = audioRef.current
      
      // Only cleanup if this is a real unmount/change, not just a re-render
      // Use a small delay to check if the question ID changed
      setTimeout(() => {
        // Only cleanup if the question ID has actually changed (not just a re-render)
        // AND the timeout/audio we're trying to cleanup is still the one we captured
        // (i.e., it hasn't been replaced by a new question's setup)
        const shouldCleanup = currentQuestionIdRef.current !== questionIdAtCleanup && 
                             (delayTimerRef.current === timeoutId || audioRef.current === audioToCleanup)
        
        if (shouldCleanup) {
          console.log('[BestResponseQuestion] Cleanup: Question changed, cleaning up old audio', {
            currentQuestionId: currentQuestionIdRef.current,
            cleanupQuestionId: questionIdAtCleanup,
            timeoutMatches: delayTimerRef.current === timeoutId,
            audioMatches: audioRef.current === audioToCleanup
          })
          // Only clear the timeout if it's still the one we captured
          if (delayTimerRef.current === timeoutId && timeoutId) {
            clearTimeout(timeoutId)
            if (delayTimerRef.current === timeoutId) {
              delayTimerRef.current = null
            }
          }
          // Only cleanup audio if it's still the one we captured
          if (audioRef.current === audioToCleanup && audioToCleanup) {
            if (handlersRef.current.handleEnded) {
              audioToCleanup.removeEventListener('ended', handlersRef.current.handleEnded)
            }
            if (handlersRef.current.handleError) {
              audioToCleanup.removeEventListener('error', handlersRef.current.handleError)
            }
            audioToCleanup.pause()
            audioToCleanup.currentTime = 0
            if (audioRef.current === audioToCleanup) {
              audioRef.current = null
            }
            handlersRef.current.handleEnded = null
            handlersRef.current.handleError = null
            timeoutSetRef.current = false
          }
        } else {
          console.log('[BestResponseQuestion] Cleanup: Skipping cleanup', {
            currentQuestionId: currentQuestionIdRef.current,
            cleanupQuestionId: questionIdAtCleanup,
            timeoutMatches: delayTimerRef.current === timeoutId,
            audioMatches: audioRef.current === audioToCleanup
          })
        }
      }, 0)
    }
  }, [question.id, question.audioReference, assetReferencesResolved, refreshTrigger])

  const handleRefresh = () => {
    // Clear the selected answer
    onAnswerChange(question.id, null)
    // Trigger audio replay
    setRefreshTrigger(prev => prev + 1)
  }

  const handleAnswerChange = (questionId, value) => {
    const currentAnswer = userAnswers[questionId]
    const newValue = parseInt(value)
    // If clicking the same option that's already selected, clear it
    if (currentAnswer === newValue) {
      onAnswerChange(questionId, null)
    } else {
      onAnswerChange(questionId, newValue)
    }
  }

  return (
    <Box>
      {/* Instruction text at top - centered, bold */}
      <Box
        sx={{
          textAlign: 'center',
          marginBottom: '24px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '16px',
        }}
      >
        <Typography
          sx={{
            fontSize: '20px',
            fontWeight: 700,
            color: '#000000',
          }}
        >
          Choose the best response.
        </Typography>
        <Button
          onClick={handleRefresh}
          variant="outlined"
          size="small"
          startIcon={<RefreshIcon />}
          sx={{
            borderColor: '#008080',
            color: '#008080',
            textTransform: 'none',
            '&:hover': {
              borderColor: '#006666',
              backgroundColor: '#f5f5f5',
            },
          }}
        >
          Refresh
        </Button>
      </Box>

      {/* Content Layout */}
      <Box
        sx={{
          display: 'flex',
          gap: '32px',
          alignItems: 'flex-start',
        }}
      >
        {/* Left side - Character Image */}
        <Box
          sx={{
            width: '50%',
            paddingRight: '16px',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'flex-start',
            paddingTop: '20px',
          }}
        >
          {question.characterImageID && (() => {
            const imageUrl = resolveAssetReference(question.characterImageID, assetReferencesResolved) || 
                            (assets && assets[question.characterImageID]) // Fallback to old format
            return imageUrl ? (
              <Box
                component="img"
                src={imageUrl}
                alt={question.character || 'Character'}
                sx={{
                  maxWidth: '280px',
                  maxHeight: '400px',
                  width: 'auto',
                  height: 'auto',
                  objectFit: 'contain',
                  objectPosition: 'center top',
                }}
              />
            ) : null
          })()}
        </Box>

        {/* Right side - Options */}
        <Box
          sx={{
            width: '50%',
            paddingLeft: '16px',
          }}
        >
          <FormControl 
            component="fieldset" 
            fullWidth 
            disabled={!optionsEnabled}
            sx={{
              '& fieldset': {
                border: 'none',
              },
              '&:focus': {
                outline: 'none',
              },
              '&:focus-visible': {
                outline: 'none',
              },
            }}
          >
            <RadioGroup
              value={userAnswers[question.id]?.toString() || ''}
              onChange={(e) => handleAnswerChange(question.id, e.target.value)}
              sx={{
                '& .MuiFormControlLabel-root': {
                  marginBottom: '12px',
                  marginLeft: 0,
                  marginRight: 0,
                  outline: 'none !important',
                  '&:focus': {
                    outline: 'none !important',
                  },
                  '&:focus-visible': {
                    outline: 'none !important',
                  },
                },
              }}
            >
              {question.options.map((option, optionIndex) => {
                const isSelected = userAnswers[question.id] === optionIndex
                return (
                  <FormControlLabel
                    key={optionIndex}
                    value={optionIndex.toString()}
                    onMouseDown={(e) => {
                      // Prevent focus on click
                      if (e.target === e.currentTarget || e.target.closest('label')) {
                        e.preventDefault()
                      }
                    }}
                    onClick={(e) => {
                      if (!optionsEnabled) {
                        e.preventDefault()
                        return
                      }
                      // If clicking an already selected option, clear it
                      if (isSelected) {
                        e.preventDefault()
                        handleAnswerChange(question.id, optionIndex.toString())
                      }
                    }}
                    control={
                      <Radio
                        sx={{
                          color: '#000000',
                          '&.Mui-checked': {
                            color: '#008080', // Teal when checked
                          },
                          padding: '4px 9px',
                          '&:focus': {
                            outline: 'none',
                          },
                          '&:focus-visible': {
                            outline: 'none',
                          },
                        }}
                      />
                    }
                    label={
                      <Typography
                        sx={{
                          fontSize: '16px',
                          color: '#000000',
                          fontFamily: 'inherit',
                          border: 'none',
                          padding: '8px',
                          outline: 'none',
                          '&:focus': {
                            outline: 'none',
                          },
                        }}
                      >
                        {option}
                      </Typography>
                    }
                    sx={{
                      border: 'none',
                      padding: '4px',
                      marginBottom: '12px',
                      outline: 'none',
                      '&:focus': {
                        outline: 'none',
                      },
                      '&:focus-visible': {
                        outline: 'none',
                      },
                      '&:hover': {
                        outline: 'none',
                      },
                    }}
                  />
                )
              })}
            </RadioGroup>
          </FormControl>
        </Box>
      </Box>
    </Box>
  )
}

export default BestResponseQuestion

