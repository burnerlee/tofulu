import { useState, useEffect, useRef } from 'react'
import { Box, Typography, Radio, RadioGroup, FormControlLabel, FormControl, Button } from '@mui/material'
import RefreshIcon from '@mui/icons-material/Refresh'

function ListenPassageQuestion({ bundle, question, assets, userAnswers, onAnswerChange, onNavigateToFirstQuestion }) {
  // Check if this is the first question in the bundle
  const isFirstQuestion = bundle.questions && bundle.questions[0]?.id === question.id
  const [showIntro, setShowIntro] = useState(() => bundle.questions && bundle.questions[0]?.id === question.id)
  const [optionsEnabled, setOptionsEnabled] = useState(() => !(bundle.questions && bundle.questions[0]?.id === question.id))
  const [isPlaying, setIsPlaying] = useState(false)
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const audioRef = useRef(null)
  const delayTimerRef = useRef(null)
  const handlersRef = useRef({ handleEnded: null, handleError: null })
  const hasPlayedRef = useRef(false)
  const currentQuestionIdRef = useRef(null)

  const startAudioPlayback = (isIntroScreen = true) => {
    console.log('[ListenPassageQuestion] startAudioPlayback called', { isIntroScreen })
    
    // Clean up any existing audio and timers
    if (audioRef.current) {
      console.log('[ListenPassageQuestion] Cleaning up existing audio')
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
      console.log('[ListenPassageQuestion] Clearing existing timeout')
      clearTimeout(delayTimerRef.current)
      delayTimerRef.current = null
    }

    // Reset state
    setOptionsEnabled(false)
    setIsPlaying(false)
    
    // Create audio element
    const audioUrl = bundle.audioUrl || 'https://cdn.pixabay.com/download/audio/2022/03/15/audio_1c15910a47.mp3?filename=this-doesnt-smell-87209.mp3'
    console.log('[ListenPassageQuestion] Creating audio element', { audioUrl })
    const audio = new Audio(audioUrl)
    audioRef.current = audio

    // Handle audio end
    const handleEnded = () => {
      console.log('[ListenPassageQuestion] Audio ended event fired', { isIntroScreen })
      setIsPlaying(false)
      if (isIntroScreen) {
        // After intro audio, move to first question
        console.log('[ListenPassageQuestion] Moving from intro to question screen')
        setShowIntro(false)
        setOptionsEnabled(true)
      } else {
        // After question audio, enable options
        console.log('[ListenPassageQuestion] Enabling options after audio')
        setOptionsEnabled(true)
      }
    }

    // Handle audio errors
    const handleError = () => {
      console.error('[ListenPassageQuestion] Audio error occurred', { isIntroScreen })
      setIsPlaying(false)
      if (isIntroScreen) {
        setShowIntro(false)
      }
      setOptionsEnabled(true)
    }

    // Store handlers for cleanup
    handlersRef.current.handleEnded = handleEnded
    handlersRef.current.handleError = handleError

    audio.addEventListener('ended', handleEnded)
    audio.addEventListener('error', handleError)

    // Wait 2 seconds, then play audio
    console.log('[ListenPassageQuestion] Setting timeout to play audio in 2 seconds')
    delayTimerRef.current = setTimeout(() => {
      console.log('[ListenPassageQuestion] Timeout fired, attempting to play audio')
      setIsPlaying(true)
      audio.play().then(() => {
        console.log('[ListenPassageQuestion] Audio play() promise resolved - audio is playing')
      }).catch((error) => {
        console.error('[ListenPassageQuestion] Error playing audio:', error)
        setIsPlaying(false)
        if (isIntroScreen) {
          setShowIntro(false)
        }
        setOptionsEnabled(true)
      })
    }, 2000)
  }

  useEffect(() => {
    console.log('[ListenPassageQuestion] useEffect triggered', {
      questionId: question.id,
      currentQuestionIdRef: currentQuestionIdRef.current,
      hasPlayedRef: hasPlayedRef.current,
      refreshTrigger,
      audioUrl: bundle.audioUrl
    })
    
    // Reset state when question changes
    const isFirst = bundle.questions && bundle.questions[0]?.id === question.id
    const isNewQuestion = currentQuestionIdRef.current !== question.id
    
    console.log('[ListenPassageQuestion] State check', {
      isFirst,
      isNewQuestion,
      refreshTrigger
    })
    
    if (isNewQuestion) {
      console.log('[ListenPassageQuestion] New question detected, resetting refs')
      currentQuestionIdRef.current = question.id
      hasPlayedRef.current = false
    }
    
    // If refresh was triggered, reset to intro (only works for first question)
    if (refreshTrigger > 0 && isFirst) {
      console.log('[ListenPassageQuestion] Refresh triggered for first question')
      setShowIntro(true)
      setOptionsEnabled(false)
      hasPlayedRef.current = false
      // Audio will be played below
    } else if (refreshTrigger > 0 && !isFirst) {
      console.log('[ListenPassageQuestion] Refresh triggered for non-first question, ignoring')
      // If refresh clicked on non-first question, just reset the trigger
      // (The refresh button should ideally navigate back to first question, but that's handled by parent)
      // Don't return early - let cleanup run
    } else if (isFirst && isNewQuestion) {
      console.log('[ListenPassageQuestion] New first question - showing intro')
      // New first question - show intro
      setShowIntro(true)
      setOptionsEnabled(false)
      hasPlayedRef.current = false
    } else if (!isFirst) {
      console.log('[ListenPassageQuestion] Non-first question - showing question screen')
      // For subsequent questions, show question screen
      setShowIntro(false)
      setOptionsEnabled(true)
    }
    
    // Play audio on intro screen (only for first question)
    if (isFirst) {
      if (refreshTrigger > 0) {
        console.log('[ListenPassageQuestion] Starting audio playback due to refresh')
        // Refresh was triggered - reset and play audio
        hasPlayedRef.current = false
        startAudioPlayback(true) // true indicates this is the intro screen
        hasPlayedRef.current = true
      } else if (isNewQuestion && !hasPlayedRef.current) {
        console.log('[ListenPassageQuestion] Starting audio playback for new question')
        // New question - play audio
        startAudioPlayback(true)
        hasPlayedRef.current = true
      } else {
        console.log('[ListenPassageQuestion] Not playing audio', {
          refreshTrigger,
          isNewQuestion,
          hasPlayedRef: hasPlayedRef.current
        })
      }
    }

    // Cleanup - only clean up if question actually changed
    return () => {
      const questionIdAtCleanup = question.id
      const timeoutId = delayTimerRef.current
      const audioToCleanup = audioRef.current
      
      // Only cleanup if this is a real unmount/change, not just a re-render
      setTimeout(() => {
        const shouldCleanup = currentQuestionIdRef.current !== questionIdAtCleanup && 
                             (delayTimerRef.current === timeoutId || audioRef.current === audioToCleanup)
        
        if (shouldCleanup) {
          console.log('[ListenPassageQuestion] Cleanup: Question changed, cleaning up old audio', {
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
          }
        } else {
          console.log('[ListenPassageQuestion] Cleanup: Skipping cleanup (likely StrictMode double-run)', {
            currentQuestionId: currentQuestionIdRef.current,
            cleanupQuestionId: questionIdAtCleanup,
            timeoutMatches: delayTimerRef.current === timeoutId,
            audioMatches: audioRef.current === audioToCleanup
          })
        }
      }, 0)
    }
  }, [question.id, bundle.audioUrl, bundle.questions, refreshTrigger])

  const handleRefresh = () => {
    console.log('[ListenPassageQuestion] Refresh button clicked', {
      questionId: question.id,
      isFirstQuestion: bundle.questions && bundle.questions[0]?.id === question.id
    })
    
    const isFirst = bundle.questions && bundle.questions[0]?.id === question.id
    
    if (isFirst) {
      // If on first question, reset to intro and restart audio
      setRefreshTrigger(prev => prev + 1)
    } else {
      // If on any other question, navigate to first question
      if (onNavigateToFirstQuestion) {
        console.log('[ListenPassageQuestion] Navigating to first question')
        onNavigateToFirstQuestion()
      }
    }
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

  const characterImageUrl = bundle.characterImageID && assets[bundle.characterImageID] 
    ? assets[bundle.characterImageID] 
    : null

  // Intro screen - show heading and character image, play audio
  if (showIntro && isFirstQuestion) {
    return (
      <Box>
        {/* Refresh button at top */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'flex-end',
            marginBottom: '16px',
          }}
        >
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

        {/* Heading */}
        <Box
          sx={{
            textAlign: 'center',
            marginBottom: '32px',
          }}
        >
          <Typography
            sx={{
              fontSize: '20px',
              fontWeight: 700,
              color: '#000000',
            }}
          >
            {bundle.heading}
          </Typography>
        </Box>

        {/* Character Image */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            paddingTop: '20px',
          }}
        >
          {characterImageUrl && (
            <Box
              component="img"
              src={characterImageUrl}
              alt={bundle.character || 'Character'}
              sx={{
                maxWidth: '280px',
                maxHeight: '400px',
                width: 'auto',
                height: 'auto',
                objectFit: 'contain',
                objectPosition: 'center top',
              }}
            />
          )}
        </Box>
      </Box>
    )
  }

  // Question screen - show question, options, and character image
  return (
    <Box>
      {/* Refresh button at top - show on all questions */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'flex-end',
          marginBottom: '16px',
        }}
      >
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
          {characterImageUrl && (
            <Box
              component="img"
              src={characterImageUrl}
              alt={bundle.character || 'Character'}
              sx={{
                maxWidth: '280px',
                maxHeight: '400px',
                width: 'auto',
                height: 'auto',
                objectFit: 'contain',
                objectPosition: 'center top',
              }}
            />
          )}
        </Box>

        {/* Right side - Question and Options */}
        <Box
          sx={{
            width: '50%',
            paddingLeft: '16px',
          }}
        >
          <Typography
            sx={{
              fontSize: '16px',
              fontWeight: 500,
              color: '#000000',
              marginBottom: '16px',
            }}
          >
            {question.question}
          </Typography>
          <FormControl component="fieldset" fullWidth disabled={!optionsEnabled}>
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

export default ListenPassageQuestion

