import { Box, Typography, Radio, RadioGroup, FormControlLabel, FormControl } from '@mui/material'
import AccountCircleIcon from '@mui/icons-material/AccountCircle'
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder'
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline'

function PostQuestion({ bundle, question, userAnswers, onAnswerChange }) {
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
          Read a social media post.
        </Typography>
      </Box>

      {/* Content Layout */}
      <Box
        sx={{
          display: 'flex',
          gap: '32px',
        }}
      >
        {/* Left side - Social Media Post in Phone Interface */}
        <Box
          sx={{
            width: '50%',
            paddingRight: '16px',
          }}
        >
          {/* Phone Container */}
          <Box
            sx={{
              border: '2px solid #333333',
              borderRadius: '24px',
              backgroundColor: '#f5f5f5',
              padding: '8px',
              maxWidth: '600px',
              width: '100%',
              margin: '0 auto',
            }}
          >
            {/* Phone Screen */}
            <Box
              sx={{
                backgroundColor: 'white',
                borderRadius: '16px',
                overflow: 'hidden',
              }}
            >
              {/* Phone Header - Teal */}
              <Box
                sx={{
                  backgroundColor: '#008080',
                  padding: '12px 16px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <Box sx={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <Box
                    sx={{
                      width: '4px',
                      height: '4px',
                      borderRadius: '50%',
                      backgroundColor: 'white',
                    }}
                  />
                  <Box
                    sx={{
                      width: '4px',
                      height: '4px',
                      borderRadius: '50%',
                      backgroundColor: 'white',
                    }}
                  />
                  <Box
                    sx={{
                      width: '4px',
                      height: '4px',
                      borderRadius: '50%',
                      backgroundColor: 'white',
                    }}
                  />
                </Box>
                <Box sx={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <Box
                    sx={{
                      width: '16px',
                      height: '16px',
                      border: '1px solid white',
                      borderRadius: '2px',
                    }}
                  />
                  <Box
                    sx={{
                      width: '16px',
                      height: '16px',
                      border: '1px solid white',
                      borderRadius: '2px',
                    }}
                  />
                </Box>
              </Box>

              {/* Post Content */}
              <Box sx={{ padding: '16px' }}>
                {/* Profile Header */}
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    marginBottom: '12px',
                  }}
                >
                  <AccountCircleIcon
                    sx={{
                      fontSize: '40px',
                      color: '#666666',
                      marginRight: '12px',
                    }}
                  />
                  <Typography
                    sx={{
                      fontSize: '16px',
                      fontWeight: 600,
                      color: '#000000',
                    }}
                  >
                    {bundle.post.owner}
                  </Typography>
                </Box>

                {/* Post Text */}
                <Typography
                  sx={{
                    fontSize: '14px',
                    lineHeight: '1.6',
                    color: '#000000',
                    marginBottom: '16px',
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  {bundle.post.content}
                </Typography>

                {/* Like and Comment Icons */}
                <Box
                  sx={{
                    display: 'flex',
                    gap: '16px',
                    paddingTop: '12px',
                    borderTop: '1px solid #e0e0e0',
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <FavoriteBorderIcon
                      sx={{
                        fontSize: '20px',
                        color: '#666666',
                      }}
                    />
                    <Typography
                      sx={{
                        fontSize: '14px',
                        color: '#666666',
                      }}
                    >
                      Like
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <ChatBubbleOutlineIcon
                      sx={{
                        fontSize: '20px',
                        color: '#666666',
                      }}
                    />
                    <Typography
                      sx={{
                        fontSize: '14px',
                        color: '#666666',
                      }}
                    >
                      Comment
                    </Typography>
                  </Box>
                </Box>
              </Box>
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

export default PostQuestion

