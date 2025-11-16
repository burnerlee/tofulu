import { Box, Typography, Radio, RadioGroup, FormControlLabel, FormControl } from '@mui/material'

function EmailQuestion({ bundle, question, userAnswers, onAnswerChange }) {
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
          Read an email.
        </Typography>
      </Box>

      {/* Content Layout */}
      <Box
        sx={{
          display: 'flex',
          gap: '32px',
        }}
      >
        {/* Left side - Email */}
        <Box
          sx={{
            width: '50%',
            paddingRight: '16px',
          }}
        >
          {/* Email Container with Teal Border */}
          <Box
            sx={{
              border: '2px solid #008080', // Teal border
              borderRadius: '4px',
              backgroundColor: 'white',
              overflow: 'hidden',
              maxHeight: '600px',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* Email Header Fields - Teal Background with White Text */}
            <Box
              sx={{
                backgroundColor: '#008080',
                padding: '12px 16px',
              }}
            >
              <Box sx={{ marginBottom: '8px', display: 'flex', width: '100%' }}>
                <Typography
                  component="span"
                  sx={{
                    fontSize: '12px',
                    fontWeight: 600,
                    color: 'black',
                    marginRight: '8px',
                    backgroundColor: 'white',
                    padding: '4px 8px',
                    width: '70px',
                  }}
                >
                  To:
                </Typography>
                <Typography
                  component="span"
                  sx={{
                    fontSize: '14px',
                    backgroundColor: 'white',
                    color: 'black',
                    padding: '4px 8px',
                    flex: 1,
                  }}
                >
                  {bundle.email.to}
                </Typography>
              </Box>
              <Box sx={{ marginBottom: '8px', display: 'flex', width: '100%' }}>
                <Typography
                  component="span"
                  sx={{
                    fontSize: '12px',
                    fontWeight: 600,
                    color: 'black',
                    marginRight: '8px',
                    backgroundColor: 'white',
                    padding: '4px 8px',
                    width: '70px',
                  }}
                >
                  From:
                </Typography>
                <Typography
                  component="span"
                  sx={{
                    fontSize: '14px',
                    backgroundColor: 'white',
                    color: 'black',
                    padding: '4px 8px',
                    flex: 1,
                  }}
                >
                  {bundle.email.from}
                </Typography>
              </Box>
              <Box sx={{ marginBottom: '8px', display: 'flex', width: '100%' }}>
                <Typography
                  component="span"
                  sx={{
                    fontSize: '12px',
                    fontWeight: 600,
                    color: 'black',
                    marginRight: '8px',
                    backgroundColor: 'white',
                    padding: '4px 8px',
                    width: '70px',
                  }}
                >
                  Date:
                </Typography>
                <Typography
                  component="span"
                  sx={{
                    fontSize: '14px',
                    backgroundColor: 'white',
                    color: 'black',
                    padding: '4px 8px',
                    flex: 1,
                  }}
                >
                  {bundle.email.date}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', width: '100%' }}>
                <Typography
                  component="span"
                  sx={{
                    fontSize: '12px',
                    fontWeight: 600,
                    color: 'black',
                    marginRight: '8px',
                    backgroundColor: 'white',
                    padding: '4px 8px',
                    width: '70px',
                  }}
                >
                  Subject:
                </Typography>
                <Typography
                  component="span"
                  sx={{
                    fontSize: '14px',
                    backgroundColor: 'white',
                    color: 'black',
                    padding: '4px 8px',
                    flex: 1,
                  }}
                >
                  {bundle.email.subject}
                </Typography>
              </Box>
            </Box>

            {/* Email Body - White Background */}
            <Box
              sx={{
                backgroundColor: 'white',
                padding: '16px',
                flex: 1,
                overflowY: 'auto',
                maxHeight: '400px',
                minHeight: '200px',
              }}
            >
              <Typography
                component="div"
                sx={{
                  fontSize: '14px',
                  lineHeight: '1.6',
                  color: '#000000',
                  whiteSpace: 'pre-wrap',
                  fontFamily: 'inherit',
                }}
              >
                {bundle.email.content.split('\n').map((line, index, array) => (
                  <span key={index}>
                    {line}
                    {index < array.length - 1 && <br />}
                  </span>
                ))}
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

export default EmailQuestion

