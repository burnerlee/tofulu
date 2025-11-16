import { Box, Typography, Radio, RadioGroup, FormControlLabel, FormControl } from '@mui/material'

function NoticeQuestion({ bundle, question, userAnswers, onAnswerChange }) {
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
          Read a notice.
        </Typography>
      </Box>

      {/* Content Layout */}
      <Box
        sx={{
          display: 'flex',
          gap: '32px',
        }}
      >
        {/* Left side - Notice Box */}
        <Box
          sx={{
            width: '50%',
            paddingRight: '16px',
          }}
        >
          {/* Outer border box */}
          <Box
            sx={{
              border: '2px solid #333333', // Darker outer border
              backgroundColor: 'white',
              padding: '2px', // Creates space for inner border
            }}
          >
            {/* Inner content box */}
            <Box
              sx={{
                border: '1px solid #000000', // Inner border
                backgroundColor: 'white',
                padding: '24px',
              }}
            >
              <Typography
                sx={{
                  fontSize: '18px',
                  fontWeight: 700,
                  color: '#333333',
                  marginBottom: '12px',
                  textAlign: 'center',
                }}
              >
                {bundle.notice.title}
              </Typography>
              {bundle.notice.subtitle && (
                <Typography
                  sx={{
                    fontSize: '16px',
                    fontWeight: 700,
                    color: '#333333',
                    marginBottom: '12px',
                    textAlign: 'center',
                  }}
                >
                  {bundle.notice.subtitle}
                </Typography>
              )}
              <Typography
                sx={{
                  fontSize: '16px',
                  lineHeight: '1.6',
                  color: '#000000',
                  fontFamily: 'inherit',
                }}
              >
                {bundle.notice.content}
              </Typography>
            </Box>
          </Box>
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

export default NoticeQuestion
