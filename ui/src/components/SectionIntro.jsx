import { useMemo } from 'react'
import { Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Divider } from '@mui/material'

// Map question types to display names and descriptions by section
const taskTypeMap = {
  speaking: {
    'listenandrepeat': {
      name: 'Listen and Repeat',
      description: 'Listen and repeat what you heard'
    },
    'interviewerquestion': {
      name: 'Take an Interview',
      description: 'Answer questions from the interviewer'
    }
  },
  writing: {
    'buildthesentence': {
      name: 'Build a Sentence',
      description: 'Create a grammatical sentence.'
    },
    'emailwriting': {
      name: 'Write an Email',
      description: 'Write an email using information provided.'
    },
    'groupdiscussionwriting': {
      name: 'Write for an Academic Discussion',
      description: 'Participate in an online discussion.'
    }
  },
  reading: {
    'passage': {
      name: 'Read a Passage',
      description: 'Read a passage and answer questions about it.'
    },
    'notice': {
      name: 'Read a Notice',
      description: 'Read a notice and answer questions about it.'
    },
    'post': {
      name: 'Read a Post',
      description: 'Read a social media post and answer questions about it.'
    },
    'email': {
      name: 'Read an Email',
      description: 'Read an email and answer questions about it.'
    },
    'fillin': {
      name: 'Fill in the Blanks',
      description: 'Complete the text by filling in the missing letters.'
    }
  },
  listening: {
    'bestresponse': {
      name: 'Choose the Best Response',
      description: 'Listen to a conversation and choose the best response.'
    },
    'listenpassage': {
      name: 'Listen to a Passage',
      description: 'Listen to a passage and answer questions about it.'
    }
  }
}

// Header colors by section
const headerColors = {
  speaking: '#d3b1aa',
  writing: '#E6A77E',
  reading: '#d3b1aa', // default
  listening: '#d3b1aa' // default
}

// Section-specific action verbs
const actionVerbs = {
  speaking: 'speak',
  writing: 'write',
  reading: 'read',
  listening: 'listen'
}

function SectionIntro({ module }) {
  const section = module.section || 'speaking'
  const sectionName = module.sectionName || 'Section'
  
  // Calculate total number of questions
  const totalQuestions = useMemo(() => {
    let count = 0
    module.questions.forEach((bundle) => {
      if (bundle.type === 'listenandrepeat') {
        // Count child questions only (parent is intro)
        count += bundle.childQuestions ? bundle.childQuestions.length : 0
      } else if (bundle.type === 'interviewerquestion') {
        // Count InterviewerQuestions only (parent is intro)
        count += bundle.InterviewerQuestions ? bundle.InterviewerQuestions.length : 0
      } else if (bundle.type === 'fillin') {
        // For fillin, count all questions in the bundle
        count += bundle.questions ? bundle.questions.length : 0
      } else {
        // For other types, count questions in bundle
        count += bundle.questions ? bundle.questions.length : 0
      }
    })
    return count
  }, [module.questions])

  // Extract unique task types from module
  const taskTypes = useMemo(() => {
    const types = new Set()
    const sectionMap = taskTypeMap[section] || {}
    
    module.questions.forEach((bundle) => {
      // Include all types that have mappings for this section
      if (sectionMap[bundle.type]) {
        types.add(bundle.type)
      }
    })
    
    return Array.from(types).map(type => ({
      type,
      ...(sectionMap[type] || { name: type, description: '' })
    }))
  }, [module.questions, section])

  const headerColor = headerColors[section] || headerColors.reading
  const actionVerb = actionVerbs[section] || 'complete'
  
  // Convert number to word
  const numberToWord = (num) => {
    const words = ['one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten']
    return words[num - 1] || num.toString()
  }

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        justifyContent: 'flex-start',
        minHeight: '100%',
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
        }}
      >
        {sectionName}
      </Typography>

      {/* Divider line */}
      <Divider
        sx={{
          width: '100%',
          marginBottom: '32px',
          borderColor: '#e0e0e0',
        }}
      />

      {/* Introduction paragraph */}
      <Box
        sx={{
          marginBottom: '32px',
          textAlign: 'left',
          maxWidth: '800px',
        }}
      >
        <Typography
          sx={{
            fontSize: '16px',
            fontWeight: 400,
            color: '#000000',
            lineHeight: 1.6,
            marginBottom: '4px',
          }}
        >
          In the {section.toLowerCase()} section, you will answer {totalQuestions} {totalQuestions === 1 ? 'question' : 'questions'} to demonstrate how well you can {actionVerb} in English.
        </Typography>
        <Typography
          sx={{
            fontSize: '16px',
            fontWeight: 400,
            color: '#000000',
            lineHeight: 1.6,
          }}
        >
          There {taskTypes.length === 1 ? 'is' : 'are'} {taskTypes.length === 1 ? 'one' : numberToWord(taskTypes.length)} {taskTypes.length === 1 ? 'type' : 'types'} of {taskTypes.length === 1 ? 'task' : 'tasks'}.
        </Typography>
      </Box>

      {/* Table */}
      <TableContainer
        component={Paper}
        sx={{
          maxWidth: '800px',
          width: '100%',
          boxShadow: 'none',
          borderRadius: '0',
          overflow: 'hidden',
          border: '1px solid #000000',
        }}
      >
        <Table sx={{ borderCollapse: 'collapse' }}>
          <TableHead>
            <TableRow
              sx={{
                backgroundColor: headerColor,
              }}
            >
              <TableCell
                sx={{
                  fontSize: '16px',
                  fontWeight: 600,
                  color: '#000000',
                  borderBottom: '1px solid #000000',
                  borderRight: '1px solid #000000',
                  padding: '12px 16px',
                  textAlign: 'center',
                }}
              >
                Type of Task
              </TableCell>
              <TableCell
                sx={{
                  fontSize: '16px',
                  fontWeight: 600,
                  color: '#000000',
                  borderBottom: '1px solid #000000',
                  padding: '12px 16px',
                  textAlign: 'center',
                }}
              >
                Description
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {taskTypes.map((task, index) => (
              <TableRow
                key={task.type}
                sx={{
                  backgroundColor: 'white',
                  '&:last-child td': {
                    borderBottom: 'none',
                  },
                }}
              >
                <TableCell
                  sx={{
                    fontSize: '16px',
                    fontWeight: 400,
                    color: '#000000',
                    padding: '12px 16px',
                    borderBottom: index < taskTypes.length - 1 ? '1px solid #000000' : 'none',
                    borderRight: '1px solid #000000',
                  }}
                >
                  {task.name}
                </TableCell>
                <TableCell
                  sx={{
                    fontSize: '16px',
                    fontWeight: 400,
                    color: '#000000',
                    padding: '12px 16px',
                    borderBottom: index < taskTypes.length - 1 ? '1px solid #000000' : 'none',
                  }}
                >
                  {task.description}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  )
}

export default SectionIntro

