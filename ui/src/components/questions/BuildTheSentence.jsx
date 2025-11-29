import { useState, useEffect, useImperativeHandle, forwardRef } from 'react'
import { Box, Typography, Avatar, Divider } from '@mui/material'

const BuildTheSentence = forwardRef(function BuildTheSentence({ bundle, question, userAnswers, onAnswerChange, assets, hasSeenIntro = false }, ref) {
  // Check if this is the first question in the bundle
  const isFirstQuestion = bundle.questions && bundle.questions[0]?.id === question.id
  const [showIntro, setShowIntro] = useState(() => bundle.questions && bundle.questions[0]?.id === question.id && !hasSeenIntro)

  const characterOneImageID = bundle.characterOneImageID || question.characterOneImageID
  const characterTwoImageID = bundle.characterTwoImageID || question.characterTwoImageID
  const sentence1 = bundle.sentence1 || question.sentence1 || ''
  const sentence2 = bundle.sentence2 || question.sentence2 || ''
  const jumbledPhrases = bundle.jumbledPhrases || question.jumbledPhrases || []

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

  // Parse sentence2 to find blanks (represented as underscores or placeholders)
  // Assuming blanks are represented as "______" or similar
  const parseSentence = (sentence) => {
    // Split by blanks (assuming format like "I used ______ ______ ______")
    const parts = sentence.split(/(______+)/g)
    return parts
  }

  const parts = parseSentence(sentence2)
  const blankCount = parts.filter(part => part.match(/^_+$/)).length

  // Initialize answer state - array of phrase indices for each blank
  const currentAnswer = userAnswers[question.id] || Array(blankCount).fill(null)
  const [draggedPhrase, setDraggedPhrase] = useState(null)

  // Calculate available phrases (those not currently in blanks)
  const usedPhrases = currentAnswer.filter(answer => answer !== null)
  const availablePhrases = jumbledPhrases
    .map((_, index) => index)
    .filter(index => !usedPhrases.includes(index))

  const handleDragStart = (e, phraseIndex) => {
    setDraggedPhrase(phraseIndex)
    e.dataTransfer.effectAllowed = 'move'
    // Make the drag image semi-transparent
    e.dataTransfer.setData('text/plain', '')
  }

  const handleDragEnd = () => {
    setDraggedPhrase(null)
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = (e, blankIndex) => {
    e.preventDefault()
    if (draggedPhrase === null) return

    const newAnswer = [...currentAnswer]
    const oldBlankIndex = newAnswer.indexOf(draggedPhrase)

    // If phrase was already in a blank, remove it from that blank
    if (oldBlankIndex !== -1) {
      newAnswer[oldBlankIndex] = null
    }

    // Place the dragged phrase in the new blank
    newAnswer[blankIndex] = draggedPhrase

    onAnswerChange(question.id, newAnswer)
    setDraggedPhrase(null)
  }

  const handlePoolDrop = (e) => {
    e.preventDefault()
    if (draggedPhrase === null) return

    // Remove phrase from blank and return it to pool
    const newAnswer = [...currentAnswer]
    const blankIndex = newAnswer.indexOf(draggedPhrase)
    if (blankIndex !== -1) {
      newAnswer[blankIndex] = null
      onAnswerChange(question.id, newAnswer)
    }
    setDraggedPhrase(null)
  }

  const handlePhraseClick = (phraseIndex) => {
    // Find first empty blank
    const emptyBlankIndex = currentAnswer.findIndex(answer => answer === null)
    if (emptyBlankIndex !== -1) {
      const newAnswer = [...currentAnswer]
      newAnswer[emptyBlankIndex] = phraseIndex
      onAnswerChange(question.id, newAnswer)
    }
  }

  const handleBlankClick = (blankIndex) => {
    // Remove phrase from blank
    if (currentAnswer[blankIndex] !== null) {
      const newAnswer = [...currentAnswer]
      newAnswer[blankIndex] = null
      onAnswerChange(question.id, newAnswer)
    }
  }

  const renderSentence = () => {
    let partIndex = 0
    let blankIndex = 0

    return parts.map((part, index) => {
      if (part.match(/^_+$/)) {
        // This is a blank
        const currentBlankIndex = blankIndex++
        const phraseIndex = currentAnswer[currentBlankIndex]
        const phrase = phraseIndex !== null ? jumbledPhrases[phraseIndex] : null

        return (
          <Box
            key={index}
            draggable={!!phrase}
            onDragStart={phrase ? (e) => handleDragStart(e, phraseIndex) : undefined}
            onDragEnd={phrase ? handleDragEnd : undefined}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, currentBlankIndex)}
            onClick={() => handleBlankClick(currentBlankIndex)}
            sx={{
              display: 'inline-block',
              position: 'relative',
              margin: '0 4px',
              cursor: phrase ? 'grab' : 'default',
              verticalAlign: 'baseline',
              userSelect: 'none',
              minWidth: phrase ? 'auto' : '120px',
              height: '28px',
              lineHeight: '28px',
              '&:active': {
                cursor: phrase ? 'grabbing' : 'default',
              },
            }}
          >
            {phrase ? (
              <>
                <Typography
                  component="span"
                  sx={{
                    fontSize: '18px',
                    color: '#000000',
                    display: 'inline',
                    lineHeight: '28px',
                    whiteSpace: 'nowrap',
                    verticalAlign: 'baseline',
                    position: 'relative',
                  }}
                >
                  {phrase}
                </Typography>
                <Box
                  component="span"
                  sx={{
                    position: 'absolute',
                    bottom: '2px',
                    left: '0',
                    right: '0',
                    height: '2px',
                    backgroundColor: '#000000',
                  }}
                />
              </>
            ) : (
              <Box
                component="span"
                sx={{
                  display: 'inline-block',
                  width: '120px',
                  height: '2px',
                  backgroundColor: '#000000',
                  verticalAlign: 'baseline',
                  position: 'absolute',
                  bottom: '2px',
                  left: '0',
                }}
              />
            )}
          </Box>
        )
      } else {
        // Regular text
        return (
          <Typography
            key={index}
            component="span"
            sx={{
              fontSize: '18px',
              color: '#000000',
              display: 'inline',
              lineHeight: '28px',
              verticalAlign: 'baseline',
            }}
          >
            {part}
          </Typography>
        )
      }
    })
  }

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
          Build a Sentence
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
            Move the words in the boxes to create grammatical sentences.
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
            In an actual test, a clock will show you how much time you have to complete this task.
          </Typography>
        </Box>
      </Box>
    )
  }

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: '24px' }}>
      {/* Instruction */}
      <Typography
        sx={{
          fontSize: '24px',
          fontWeight: 600,
          color: '#000000',
          marginBottom: '32px',
          textAlign: 'center',
          flexShrink: 0,
        }}
      >
        Make an appropriate sentence.
      </Typography>

      {/* Character 1 with Sentence 1 */}
      <Box
        sx={{
          display: 'flex',
          gap: '16px',
          alignItems: 'flex-start',
          marginBottom: '20px',
          flexShrink: 0,
        }}
      >
        {characterOneImageID && assets && assets[characterOneImageID] && (
          <Avatar
            src={assets[characterOneImageID]}
            alt="Character 1"
            sx={{
              width: 70,
              height: 70,
              flexShrink: 0,
            }}
          />
        )}
        <Typography
          sx={{
            fontSize: '18px',
            color: '#000000',
            lineHeight: '1.6',
            flex: 1,
            paddingTop: '12px',
          }}
        >
          {sentence1}
        </Typography>
      </Box>

      {/* Character 2 with Sentence 2 (with blanks) */}
      <Box
        sx={{
          display: 'flex',
          gap: '16px',
          alignItems: 'flex-start',
          marginBottom: '32px',
          flexShrink: 0,
        }}
      >
        {characterTwoImageID && assets && assets[characterTwoImageID] && (
          <Avatar
            src={assets[characterTwoImageID]}
            alt="Character 2"
            sx={{
              width: 70,
              height: 70,
              flexShrink: 0,
            }}
          />
        )}
        <Box
          sx={{
            flex: 1,
            lineHeight: '24px',
            display: 'block',
            paddingTop: '12px',
          }}
        >
          {renderSentence()}
        </Box>
      </Box>

      {/* Jumbled Phrases */}
      <Box
        onDragOver={(e) => {
          e.preventDefault()
          e.dataTransfer.dropEffect = 'move'
        }}
        onDrop={handlePoolDrop}
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '12px',
          justifyContent: 'center',
          marginTop: '32px',
          padding: '16px',
          flexShrink: 0,
          '&:hover': {
            backgroundColor: 'rgba(0, 128, 128, 0.02)',
          },
        }}
      >
        {jumbledPhrases.map((phrase, index) => {
          const isUsed = currentAnswer.includes(index)
          const isAvailable = availablePhrases.includes(index)

          if (isUsed && !isAvailable) {
            return null // Don't show used phrases
          }

          return (
            <Typography
              key={index}
              component="span"
              draggable
              onDragStart={(e) => handleDragStart(e, index)}
              onDragEnd={handleDragEnd}
              onClick={() => handlePhraseClick(index)}
              sx={{
                padding: '6px 12px',
                cursor: 'grab',
                fontSize: '18px',
                color: '#000000',
                userSelect: 'none',
                display: 'inline-block',
                '&:hover': {
                  backgroundColor: '#f5f5f5',
                  borderRadius: '4px',
                },
                '&:active': {
                  cursor: 'grabbing',
                },
              }}
            >
              {phrase}
            </Typography>
          )
        })}
      </Box>
    </Box>
  )
})

export default BuildTheSentence

