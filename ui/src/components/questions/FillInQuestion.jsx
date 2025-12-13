import { Box, Typography, TextField } from '@mui/material'
import { useRef, useState } from 'react'

function FillInQuestion({ bundle, questions, userAnswers, onAnswerChange, questionRange }) {
  const inputRefs = useRef({})
  const [editingWord, setEditingWord] = useState(null) // Track which word is being edited
  const [currentInputs, setCurrentInputs] = useState({}) // Track current input state for incomplete words

  const handleAnswerChange = (questionId, value, missingLetters, providedLetters = '') => {
    // Only save answer if all letters are filled, otherwise save empty string
    const isComplete = value.length === missingLetters && value.split('').every(char => char.trim() !== '')
    // Save the entire word (provided letters + filled letters) if complete
    const answerToSave = isComplete ? (providedLetters + value) : ''
    
    // Create the new answers state
    const newAnswers = { ...userAnswers, [questionId]: answerToSave }
    
    // Log the current state for debugging
    console.log('=== Fill-in Answer Change ===')
    console.log('Question ID:', questionId)
    console.log('Provided letters:', providedLetters)
    console.log('Input value (missing letters):', value)
    console.log('Is complete:', isComplete)
    console.log('Answer to save (full word):', answerToSave)
    console.log('Current answers state:', userAnswers)
    console.log('New answers state:', newAnswers)
    
    // Create array of answers in question order for easier debugging
    const answersArray = questions.map(q => ({
      questionId: q.id,
      answer: newAnswers[q.id] || '',
      isComplete: (newAnswers[q.id] || '').length > 0
    }))
    console.log('Answers array (in order):', answersArray)
    console.log('============================')
    
    // Pass question type 'fillin' so response tracker knows to format appropriately
    onAnswerChange(questionId, answerToSave, 'fillin')
    
    // Update current input state for display
    // Always keep currentInputs updated when editing, even if incomplete
    // Only remove when word is complete AND not being edited
    if (!isComplete || editingWord === questionId) {
      setCurrentInputs(prev => ({ ...prev, [questionId]: value }))
    } else {
      // Remove from current inputs when complete and not editing
      setCurrentInputs(prev => {
        const newState = { ...prev }
        delete newState[questionId]
        return newState
      })
    }
  }

  const getInputRef = (questionId, letterIndex) => {
    const key = `${questionId}-${letterIndex}`
    if (!inputRefs.current[key]) {
      inputRefs.current[key] = null
    }
    return inputRefs.current[key]
  }

  const setInputRef = (questionId, letterIndex, ref) => {
    const key = `${questionId}-${letterIndex}`
    inputRefs.current[key] = ref
  }

  const focusInput = (questionId, letterIndex) => {
    const ref = getInputRef(questionId, letterIndex)
    if (ref) {
      ref.focus()
    }
  }

  const handleLetterChange = (questionId, letterIndex, value, missingLetters, providedLetters) => {
    // Get current input value from state or saved answer
    const savedAnswer = userAnswers[questionId] || ''
    // Extract just the missing letters part from saved answer (if it's a full word)
    const savedMissingPart = savedAnswer.startsWith(providedLetters) 
      ? savedAnswer.slice(providedLetters.length) 
      : savedAnswer
    const currentInput = currentInputs[questionId] !== undefined ? currentInputs[questionId] : savedMissingPart
    const answerArray = currentInput.split('')
    // Ensure array is exactly the right length
    while (answerArray.length < missingLetters) {
      answerArray.push('')
    }
    // Trim to exact length if longer
    if (answerArray.length > missingLetters) {
      answerArray.length = missingLetters
    }
    
    // If value is empty (backspace), shift letters left
    if (value === '') {
      // Shift all letters to the right of current position left by one
      for (let i = letterIndex; i < missingLetters - 1; i++) {
        answerArray[i] = answerArray[i + 1] || ''
      }
      // Clear the last position
      answerArray[missingLetters - 1] = ''
      const newAnswer = answerArray.slice(0, missingLetters).join('')
      
      handleAnswerChange(questionId, newAnswer, missingLetters, providedLetters)
      
      // Stay in editing mode - don't exit when word becomes incomplete
      // Stay in current field after backspace
      return
    }
    
    // Update the specific letter position - take the last character
    const newChar = value.slice(-1) // Only take the last character
    answerArray[letterIndex] = newChar
    // Join back to string
    const newAnswer = answerArray.join('')
    
    handleAnswerChange(questionId, newAnswer, missingLetters, providedLetters)
    
    // If word becomes complete, exit editing mode
    const isComplete = newAnswer.length === missingLetters && newAnswer.split('').every(char => char.trim() !== '')
    if (isComplete) {
      setEditingWord(null)
    }
    
    // Auto-focus next input if not at the end
    if (letterIndex < missingLetters - 1) {
      // Small delay to ensure the value is updated
      setTimeout(() => {
        focusInput(questionId, letterIndex + 1)
      }, 0)
    }
  }

  const handleKeyDown = (e, questionId, letterIndex, missingLetters, providedLetters) => {
    // Handle backspace on empty field - move to previous field and delete that character
    if (e.key === 'Backspace' && !e.target.value && letterIndex > 0) {
      e.preventDefault()
      // Get current input value
      const savedAnswer = userAnswers[questionId] || ''
      const savedMissingPart = savedAnswer.startsWith(providedLetters) 
        ? savedAnswer.slice(providedLetters.length) 
        : savedAnswer
      const currentInput = currentInputs[questionId] !== undefined ? currentInputs[questionId] : savedMissingPart
      const answerArray = currentInput.split('')
      while (answerArray.length < missingLetters) {
        answerArray.push('')
      }
      
      // Delete the character at the previous position and shift left
      const prevIndex = letterIndex - 1
      for (let i = prevIndex; i < missingLetters - 1; i++) {
        answerArray[i] = answerArray[i + 1] || ''
      }
      answerArray[missingLetters - 1] = ''
      
      const newAnswer = answerArray.join('')
      handleAnswerChange(questionId, newAnswer, missingLetters, providedLetters)
      
      // Focus the previous field
      focusInput(questionId, prevIndex)
    }
    // Handle backspace on filled field - will be handled by onChange with empty value
    // Handle arrow keys
    else if (e.key === 'ArrowLeft' && letterIndex > 0) {
      e.preventDefault()
      focusInput(questionId, letterIndex - 1)
    }
    else if (e.key === 'ArrowRight' && letterIndex < missingLetters - 1) {
      e.preventDefault()
      focusInput(questionId, letterIndex + 1)
    }
    // Handle paste
    else if (e.key === 'v' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault()
      navigator.clipboard.readText().then((text) => {
        const savedAnswer = userAnswers[questionId] || ''
        const savedMissingPart = savedAnswer.startsWith(providedLetters) 
          ? savedAnswer.slice(providedLetters.length) 
          : savedAnswer
        const currentInput = currentInputs[questionId] !== undefined ? currentInputs[questionId] : savedMissingPart
        const answerArray = currentInput.split('')
        const pasteText = text.slice(0, missingLetters - letterIndex)
        
        pasteText.split('').forEach((char, idx) => {
          const pos = letterIndex + idx
          if (pos < missingLetters) {
            answerArray[pos] = char
          }
        })
        
        const newAnswer = answerArray.join('')
        handleAnswerChange(questionId, newAnswer, missingLetters, providedLetters)
        
        // Focus the next empty field or the last field
        const nextEmptyIndex = Math.min(letterIndex + pasteText.length, missingLetters - 1)
        focusInput(questionId, nextEmptyIndex)
      })
    }
  }

  const handlePaste = (e, questionId, letterIndex, missingLetters, providedLetters) => {
    e.preventDefault()
    const pasteText = (e.clipboardData.getData('text') || '').slice(0, missingLetters - letterIndex)
    
    const savedAnswer = userAnswers[questionId] || ''
    const savedMissingPart = savedAnswer.startsWith(providedLetters) 
      ? savedAnswer.slice(providedLetters.length) 
      : savedAnswer
    const currentInput = currentInputs[questionId] !== undefined ? currentInputs[questionId] : savedMissingPart
    const answerArray = currentInput.split('')
    
    pasteText.split('').forEach((char, idx) => {
      const pos = letterIndex + idx
      if (pos < missingLetters) {
        answerArray[pos] = char
      }
    })
    
    const newAnswer = answerArray.join('')
    handleAnswerChange(questionId, newAnswer, missingLetters, providedLetters)
    
    // Focus the next empty field or the last field
    const nextEmptyIndex = Math.min(letterIndex + pasteText.length, missingLetters - 1)
    focusInput(questionId, nextEmptyIndex)
  }

  // Parse the paragraph text to identify blanks
  // Blanks are marked with underscores like "i____" or "reg____"
  const renderParagraphWithBlanks = () => {
    const text = bundle.paragraph.text
    const parts = []
    let currentIndex = 0
    let blankIndex = 0

    // Split text by blanks (pattern: letters followed by underscores)
    const blankPattern = /\b[a-zA-Z]+_+\b/g
    let match
    let lastIndex = 0

    while ((match = blankPattern.exec(text)) !== null) {
      // Add text before the blank
      if (match.index > lastIndex) {
        parts.push({
          type: 'text',
          content: text.substring(lastIndex, match.index)
        })
      }

      // Add the blank
      const question = questions[blankIndex]
      if (question) {
        // Extract provided letters (everything before the underscores)
        const fullMatch = match[0]
        const providedLetters = fullMatch.replace(/_+/g, '')
        const missingLetters = question.missingLetters || 1
        
        parts.push({
          type: 'blank',
          questionId: question.id,
          providedLetters: providedLetters,
          missingLetters: missingLetters,
          questionNumber: blankIndex + 1
        })
        blankIndex++
      }

      lastIndex = match.index + match[0].length
    }

    // Add remaining text after last blank
    if (lastIndex < text.length) {
      parts.push({
        type: 'text',
        content: text.substring(lastIndex)
      })
    }

    return parts
  }

  const paragraphParts = renderParagraphWithBlanks()

  return (
    <Box>
      {/* Instruction text at top - centered, bold, large */}
      <Box
        sx={{
          textAlign: 'center',
          marginBottom: '24px',
        }}
      >
        <Typography
          sx={{
            fontSize: '20px',
            fontWeight: 700,
            color: '#000000',
          }}
        >
          Fill in the missing letters in the paragraph.
        </Typography>
      </Box>

      {/* Paragraph with Blanks */}
      <Box
        sx={{
          marginBottom: '32px',
        }}
      >
        <Typography
          component="div"
          sx={{
            fontSize: '16px',
            lineHeight: '1.8',
            color: '#000000',
            fontFamily: 'inherit',
          }}
        >
          {paragraphParts.map((part, index) => {
            if (part.type === 'text') {
              return <span key={index}>{part.content}</span>
            } else {
              // Blank with provided letters fixed and individual input fields for each missing letter
              const savedAnswer = userAnswers[part.questionId] || ''
              const missingLetters = part.missingLetters || 1
              const providedLetters = part.providedLetters || ''
              
              // Check if word is complete (saved answer exists and is the full word)
              const expectedFullWordLength = providedLetters.length + missingLetters
              const isComplete = savedAnswer.length === expectedFullWordLength && savedAnswer.startsWith(providedLetters)
              const isEditing = editingWord === part.questionId
              
              // If complete and not editing, show as a single word with distinction
              if (isComplete && !isEditing) {
                const filledLetters = savedAnswer.slice(providedLetters.length)
                return (
                  <Box
                    key={index}
                    component="span"
                    sx={{
                      display: 'inline-flex',
                      alignItems: 'baseline',
                      margin: '0 2px',
                      cursor: 'pointer',
                      '&:hover': {
                        textDecoration: 'underline',
                      },
                    }}
                    onClick={() => {
                      setEditingWord(part.questionId)
                      // Extract just the missing letters part from saved full word for editing
                      const missingPart = savedAnswer.slice(providedLetters.length)
                      setCurrentInputs(prev => ({ ...prev, [part.questionId]: missingPart }))
                      // Focus the first filled letter (first input field) when clicking to edit
                      setTimeout(() => {
                        focusInput(part.questionId, 0)
                      }, 0)
                    }}
                  >
                    {/* Display provided letters as normal text */}
                    <Typography
                      component="span"
                      sx={{
                        fontSize: '16px',
                        color: '#000000',
                        fontFamily: 'inherit',
                        fontWeight: 'normal',
                        letterSpacing: 'normal',
                      }}
                    >
                      {providedLetters}
                    </Typography>
                    
                    {/* Display filled letters with grey background */}
                    {filledLetters.split('').map((letter, letterIndex) => (
                      <Box
                        key={letterIndex}
                        component="span"
                        sx={{
                          display: 'inline-block',
                          margin: '0',
                          padding: '2px 2px',
                          fontSize: '16px',
                          fontFamily: 'inherit',
                          fontWeight: 'normal',
                          color: '#000000',
                          backgroundColor: '#e0e0e0',
                          borderRadius: '2px',
                          lineHeight: '1',
                        }}
                      >
                        {letter}
                      </Box>
                    ))}
                  </Box>
                )
              }
              
              // Otherwise, show individual input fields
              // Extract just the missing letters part from saved answer (if it's a full word)
              const savedMissingPart = savedAnswer.startsWith(providedLetters) 
                ? savedAnswer.slice(providedLetters.length) 
                : savedAnswer
              const currentInputValue = currentInputs[part.questionId] !== undefined 
                ? currentInputs[part.questionId] 
                : (savedMissingPart || '')
              const answerArray = currentInputValue.split('')
              
              return (
                <Box
                  key={index}
                  component="span"
                  sx={{
                    display: 'inline-flex',
                    alignItems: 'baseline',
                    margin: '0 2px',
                    verticalAlign: 'baseline',
                  }}
                >
                  {/* Display provided letters as fixed text */}
                  <Typography
                    component="span"
                    sx={{
                      fontSize: '16px',
                      color: '#000000',
                      fontFamily: 'inherit',
                      marginRight: isComplete ? '0px' : '2px',
                    }}
                  >
                    {part.providedLetters}
                  </Typography>
                  
                  {/* Individual input fields for each missing letter */}
                  {Array.from({ length: missingLetters }, (_, letterIndex) => {
                    const letterValue = answerArray[letterIndex] || ''
                    const isLastLetter = letterIndex === missingLetters - 1
                    return (
                      <Box
                        key={letterIndex}
                        component="span"
                        sx={{
                          display: 'inline-block',
                          margin: '0 1px',
                          position: 'relative',
                          width: '18px',
                        }}
                      >
                        <input
                          ref={(el) => setInputRef(part.questionId, letterIndex, el)}
                          type="text"
                          value={letterValue}
                          onChange={(e) => {
                            // Only handle non-empty values here (backspace is handled in onKeyDown)
                            if (e.target.value !== '') {
                              handleLetterChange(part.questionId, letterIndex, e.target.value, missingLetters, providedLetters)
                            }
                          }}
                          onKeyDown={(e) => {
                            // Handle backspace on filled field - delete current character and shift left
                            if (e.key === 'Backspace' && letterValue) {
                              e.preventDefault()
                              handleLetterChange(part.questionId, letterIndex, '', missingLetters, providedLetters)
                              return
                            }
                            handleKeyDown(e, part.questionId, letterIndex, missingLetters, providedLetters)
                          }}
                          onPaste={(e) => handlePaste(e, part.questionId, letterIndex, missingLetters, providedLetters)}
                          onFocus={(e) => {
                            // Position cursor at the end without selecting text
                            const length = e.target.value.length
                            e.target.setSelectionRange(length, length)
                            setEditingWord(part.questionId)
                          }}
                          onMouseDown={(e) => {
                            // Prevent text selection on click
                            e.preventDefault()
                            e.target.focus()
                            // Position cursor at click position or end
                            const length = e.target.value.length
                            e.target.setSelectionRange(length, length)
                          }}
                          onSelect={(e) => {
                            // Prevent any text selection
                            const length = e.target.value.length
                            e.target.setSelectionRange(length, length)
                          }}
                          maxLength={1}
                          style={{
                            width: '18px',
                            minWidth: '18px',
                            padding: '2px 0',
                            fontSize: '16px',
                            textAlign: 'center',
                            border: 'none',
                            borderBottom: '1px dashed #9e9e9e',
                            outline: 'none',
                            background: letterValue ? '#e0e0e0' : '#f5f5f5',
                            fontFamily: 'inherit',
                            fontWeight: letterValue ? 'bold' : 'normal',
                            borderRadius: '2px',
                            marginRight: isLastLetter ? '0' : '0',
                          }}
                        />
                      </Box>
                    )
                  })}
                </Box>
              )
            }
          })}
        </Typography>
      </Box>
    </Box>
  )
}

export default FillInQuestion

