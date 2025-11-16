import { Box, Typography, Radio, RadioGroup, FormControlLabel, FormControl } from '@mui/material'

function PassageQuestion({ bundle, question, userAnswers, onAnswerChange }) {
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
      {/* Centered Title */}
      <Box
        sx={{
          textAlign: 'center',
          marginBottom: '24px',
        }}
      >
        <Typography
          sx={{
            fontSize: '24px',
            fontWeight: 700,
            color: '#000000',
          }}
        >
          {bundle.passage.title}
        </Typography>
      </Box>

      {/* Content Layout */}
      <Box
        sx={{
          display: 'flex',
          gap: '32px',
        }}
      >
        {/* Left side - Passage */}
        <Box
          sx={{
            width: '50%',
            paddingRight: '16px',
          }}
        >
          {bundle.passage.content.map((paragraph, index) => (
            <Typography
              key={index}
              sx={{
                fontSize: '16px',
                lineHeight: '1.6',
                color: '#000000',
                marginBottom: '16px',
                fontFamily: 'inherit',
              }}
            >
              {paragraph}
            </Typography>
          ))}
        </Box>

        {/* Right side - Single Question */}
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
          <FormControl component="fieldset" fullWidth>
            <RadioGroup
              value={userAnswers[question.id]?.toString() || ''}
              onChange={(e) => handleAnswerChange(question.id, e.target.value)}
              sx={{
                '& .MuiFormControlLabel-root': {
                  marginBottom: '12px',
                  marginLeft: 0,
                  marginRight: 0,
                },
              }}
            >
              {question.options.map((option, optionIndex) => {
                const isSelected = userAnswers[question.id] === optionIndex
                return (
                  <FormControlLabel
                    key={optionIndex}
                    value={optionIndex.toString()}
                    onClick={(e) => {
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
                        }}
                      />
                    }
                    label={
                      <Typography
                        sx={{
                          fontSize: '16px',
                          color: '#000000',
                          fontFamily: 'inherit',
                        }}
                      >
                        {option}
                      </Typography>
                    }
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

export default PassageQuestion

