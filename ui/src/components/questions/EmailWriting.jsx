import { useState, useRef, useEffect, useImperativeHandle, forwardRef } from 'react'
import { Box, Typography, TextareaAutosize, Button, Divider } from '@mui/material'
import ContentCutIcon from '@mui/icons-material/ContentCut'
import ContentPasteIcon from '@mui/icons-material/ContentPaste'
import UndoIcon from '@mui/icons-material/Undo'
import RedoIcon from '@mui/icons-material/Redo'
import VisibilityIcon from '@mui/icons-material/Visibility'
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff'

const EmailWriting = forwardRef(function EmailWriting({ bundle, question, userAnswers, onAnswerChange, isTimerExpired = false, hasSeenIntro = false }, ref) {
  // Check if this is the first question in the bundle
  const isFirstQuestion = bundle.questions && bundle.questions[0]?.id === question.id
  const [showIntro, setShowIntro] = useState(() => bundle.questions && bundle.questions[0]?.id === question.id && !hasSeenIntro)

  const textAreaRef = useRef(null)
  const [wordCount, setWordCount] = useState(0)
  const [showWordCount, setShowWordCount] = useState(true)
  const [canUndo, setCanUndo] = useState(false)
  const [canRedo, setCanRedo] = useState(false)
  const [canCut, setCanCut] = useState(false)
  const [canPaste, setCanPaste] = useState(false)
  const historyRef = useRef([])
  const historyIndexRef = useRef(-1)

  const currentAnswer = userAnswers[question.id] || ''

  // Reset intro state when question changes
  useEffect(() => {
    const shouldShowIntro = bundle.questions && bundle.questions[0]?.id === question.id && !hasSeenIntro
    setShowIntro(shouldShowIntro)
  }, [question.id, bundle.questions, hasSeenIntro])

  // Expose method to dismiss intro
  useImperativeHandle(ref, () => ({
    dismissIntro: () => {
      if (showIntro && isFirstQuestion) {
        setShowIntro(false)
        return true // Return true if intro was dismissed
      }
      return false // Return false if no intro to dismiss
    },
    isShowingIntro: () => showIntro && isFirstQuestion
  }), [showIntro, isFirstQuestion])

  // Update word count when answer changes
  useEffect(() => {
    const words = currentAnswer.trim().split(/\s+/).filter(word => word.length > 0)
    setWordCount(words.length)
  }, [currentAnswer])

  // Update button states based on text selection and clipboard
  useEffect(() => {
    const updateButtonStates = () => {
      if (textAreaRef.current) {
        const textarea = textAreaRef.current
        const hasSelection = textarea.selectionStart !== textarea.selectionEnd
        setCanCut(hasSelection)
        
        // Check if clipboard has text (simplified - always enable paste)
        setCanPaste(true)
      }
    }

    const textarea = textAreaRef.current
    if (textarea) {
      textarea.addEventListener('select', updateButtonStates)
      textarea.addEventListener('keyup', updateButtonStates)
      textarea.addEventListener('mouseup', updateButtonStates)
      return () => {
        textarea.removeEventListener('select', updateButtonStates)
        textarea.removeEventListener('keyup', updateButtonStates)
        textarea.removeEventListener('mouseup', updateButtonStates)
      }
    }
  }, [])

  const handleTextChange = (e) => {
    const newValue = e.target.value
    onAnswerChange(question.id, newValue)
    
    // Update history for undo/redo
    if (historyIndexRef.current < historyRef.current.length - 1) {
      historyRef.current = historyRef.current.slice(0, historyIndexRef.current + 1)
    }
    historyRef.current.push(newValue)
    historyIndexRef.current = historyRef.current.length - 1
    setCanUndo(historyIndexRef.current > 0)
    setCanRedo(false)
  }

  const handleCut = () => {
    if (textAreaRef.current) {
      const textarea = textAreaRef.current
      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      if (start !== end) {
        const text = currentAnswer
        const newText = text.substring(0, start) + text.substring(end)
        onAnswerChange(question.id, newText)
        textarea.setSelectionRange(start, start)
      }
    }
  }

  const handlePaste = async () => {
    if (textAreaRef.current) {
      try {
        const text = await navigator.clipboard.readText()
        const textarea = textAreaRef.current
        const start = textarea.selectionStart
        const end = textarea.selectionEnd
        const currentText = currentAnswer
        const newText = currentText.substring(0, start) + text + currentText.substring(end)
        onAnswerChange(question.id, newText)
        // Set cursor position after pasted text
        setTimeout(() => {
          textarea.setSelectionRange(start + text.length, start + text.length)
          textarea.focus()
        }, 0)
      } catch (err) {
        console.error('Failed to paste:', err)
      }
    }
  }

  const handleUndo = () => {
    if (historyIndexRef.current > 0) {
      historyIndexRef.current--
      const previousValue = historyRef.current[historyIndexRef.current]
      onAnswerChange(question.id, previousValue)
      setCanUndo(historyIndexRef.current > 0)
      setCanRedo(true)
    }
  }

  const handleRedo = () => {
    if (historyIndexRef.current < historyRef.current.length - 1) {
      historyIndexRef.current++
      const nextValue = historyRef.current[historyIndexRef.current]
      onAnswerChange(question.id, nextValue)
      setCanUndo(true)
      setCanRedo(historyIndexRef.current < historyRef.current.length - 1)
    }
  }

  // Initialize history on mount
  useEffect(() => {
    if (historyRef.current.length === 0) {
      historyRef.current = [currentAnswer]
      historyIndexRef.current = 0
      setCanUndo(false)
      setCanRedo(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Intro screen
  if (showIntro && isFirstQuestion) {
    return (
      <Box
        sx={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          padding: '64px 48px 48px 64px',
          maxWidth: '900px',
          margin: '0 auto',
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
          Write an Email
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
            You will read some information and use the information to write an email.
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
            You will have 7 minutes to write the email.
          </Typography>
        </Box>
      </Box>
    )
  }

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Content Layout */}
      <Box
        sx={{
          display: 'flex',
          gap: '32px',
          flex: 1,
          overflow: 'hidden',
        }}
      >
        {/* Left side - Instructions/Content */}
        <Box
          sx={{
            width: '50%',
            paddingRight: '16px',
            display: 'flex',
            flexDirection: 'column',
            overflowY: 'auto',
          }}
        >
          <Box
            sx={{
              fontSize: '16px',
              lineHeight: '1.6',
              color: '#000000',
              '& p': {
                marginBottom: '16px',
              },
              '& ul': {
                marginLeft: '24px',
                marginBottom: '16px',
                paddingLeft: '20px',
                listStyleType: 'disc',
              },
              '& ol': {
                marginLeft: '24px',
                marginBottom: '16px',
                paddingLeft: '20px',
                listStyleType: 'decimal',
              },
              '& li': {
                marginBottom: '8px',
                display: 'list-item',
              },
            }}
            dangerouslySetInnerHTML={{ __html: bundle.content || question.content }}
          />
        </Box>

        {/* Right side - Email Writing Area */}
        <Box
          sx={{
            width: '50%',
            paddingLeft: '16px',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
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
            Your Response:
          </Typography>

          {/* Email Header Fields */}
          <Box
            sx={{
              marginBottom: '16px',
            }}
          >
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                marginBottom: '8px',
              }}
            >
              <Typography
                sx={{
                  fontSize: '14px',
                  fontWeight: 500,
                  color: '#000000',
                  marginRight: '8px',
                  minWidth: '60px',
                }}
              >
                To:
              </Typography>
              <Typography
                sx={{
                  fontSize: '14px',
                  color: '#000000',
                }}
              >
                {bundle.to || question.to}
              </Typography>
            </Box>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <Typography
                sx={{
                  fontSize: '14px',
                  fontWeight: 500,
                  color: '#000000',
                  marginRight: '8px',
                  minWidth: '60px',
                }}
              >
                Subject:
              </Typography>
              <Typography
                sx={{
                  fontSize: '14px',
                  color: '#000000',
                }}
              >
                {bundle.subject || question.subject}
              </Typography>
            </Box>
          </Box>

          {/* Editing Buttons and Word Count */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '12px',
              flexShrink: 0,
            }}
          >
            <Box sx={{ display: 'flex', gap: '8px' }}>
              <Button
                variant="contained"
                size="small"
                startIcon={<ContentCutIcon />}
                onClick={handleCut}
                disabled={!canCut || isTimerExpired}
                sx={{
                  minWidth: '80px',
                  textTransform: 'none',
                  backgroundColor: '#008080',
                  borderColor: '#008080',
                  color: 'white',
                  '&:hover': {
                    backgroundColor: canCut ? '#006666' : '#008080',
                  },
                  '&.Mui-disabled': {
                    backgroundColor: '#008080',
                    color: 'white',
                    opacity: 0.6,
                  },
                }}
              >
                Cut
              </Button>
              <Button
                variant="outlined"
                size="small"
                startIcon={<ContentPasteIcon />}
                onClick={handlePaste}
                disabled={!canPaste || isTimerExpired}
                sx={{
                  minWidth: '80px',
                  textTransform: 'none',
                  borderColor: '#e0e0e0',
                  color: '#000000',
                  backgroundColor: '#f5f5f5',
                  '&:hover': {
                    borderColor: '#e0e0e0',
                    backgroundColor: '#eeeeee',
                  },
                  '&.Mui-disabled': {
                    borderColor: '#e0e0e0',
                    color: '#9e9e9e',
                    backgroundColor: '#f5f5f5',
                  },
                }}
              >
                Paste
              </Button>
              <Button
                variant="outlined"
                size="small"
                startIcon={<UndoIcon />}
                onClick={handleUndo}
                disabled={!canUndo || isTimerExpired}
                sx={{
                  minWidth: '80px',
                  textTransform: 'none',
                  borderColor: '#e0e0e0',
                  color: '#000000',
                  backgroundColor: '#f5f5f5',
                  '&:hover': {
                    borderColor: '#e0e0e0',
                    backgroundColor: '#eeeeee',
                  },
                  '&.Mui-disabled': {
                    borderColor: '#e0e0e0',
                    color: '#9e9e9e',
                    backgroundColor: '#f5f5f5',
                  },
                }}
              >
                Undo
              </Button>
              <Button
                variant="outlined"
                size="small"
                startIcon={<RedoIcon />}
                onClick={handleRedo}
                disabled={!canRedo || isTimerExpired}
                sx={{
                  minWidth: '80px',
                  textTransform: 'none',
                  borderColor: '#e0e0e0',
                  color: '#000000',
                  backgroundColor: '#f5f5f5',
                  '&:hover': {
                    borderColor: '#e0e0e0',
                    backgroundColor: '#eeeeee',
                  },
                  '&.Mui-disabled': {
                    borderColor: '#e0e0e0',
                    color: '#9e9e9e',
                    backgroundColor: '#f5f5f5',
                  },
                }}
              >
                Redo
              </Button>
            </Box>

            {/* Word Count Toggle */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <Button
                size="small"
                startIcon={showWordCount ? <VisibilityOffIcon /> : <VisibilityIcon />}
                onClick={() => setShowWordCount(!showWordCount)}
                sx={{
                  textTransform: 'none',
                  color: '#666666',
                  minWidth: 'auto',
                  padding: '4px 8px',
                  '&:hover': {
                    backgroundColor: 'rgba(0, 0, 0, 0.04)',
                  },
                }}
              >
                {showWordCount ? 'Hide Word Count' : 'Show Word Count'}
              </Button>
              {showWordCount && (
                <Typography
                  sx={{
                    fontSize: '14px',
                    color: '#000000',
                    minWidth: '30px',
                  }}
                >
                  {wordCount}
                </Typography>
              )}
            </Box>
          </Box>

          {/* Text Area */}
          <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
            <TextareaAutosize
              ref={textAreaRef}
              value={currentAnswer}
              onChange={handleTextChange}
              disabled={isTimerExpired}
              placeholder=""
              style={{
                width: '100%',
                height: '100%',
                minHeight: '200px',
                padding: '12px',
                fontSize: '14px',
                fontFamily: 'inherit',
                border: '1px solid #e0e0e0',
                borderRadius: '4px',
                resize: 'none',
                lineHeight: '1.6',
                backgroundColor: isTimerExpired ? '#f5f5f5' : 'white',
                cursor: isTimerExpired ? 'not-allowed' : 'text',
                opacity: isTimerExpired ? 0.6 : 1,
                overflowY: 'auto',
              }}
            />
          </Box>
        </Box>
      </Box>
    </Box>
  )
})

export default EmailWriting
