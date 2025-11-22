import { useMemo } from 'react'
import { Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from '@mui/material'

// Map question types to display names and descriptions
const taskTypeMap = {
  'listenandrepeat': {
    name: 'Listen and Repeat',
    description: 'Listen and repeat what you heard'
  },
  'interviewerquestion': {
    name: 'Take an Interview',
    description: 'Answer questions from the interviewer'
  }
}

function SpeakingIntro({ module }) {
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
    module.questions.forEach((bundle) => {
      if (bundle.type === 'listenandrepeat' || bundle.type === 'interviewerquestion') {
        types.add(bundle.type)
      }
    })
    return Array.from(types).map(type => ({
      type,
      ...taskTypeMap[type]
    }))
  }, [module.questions])

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        justifyContent: 'flex-start',
        minHeight: '100%',
        padding: '48px 24px',
        maxWidth: '900px',
        margin: '0 auto',
      }}
    >
      {/* Title */}
      <Typography
        sx={{
          fontSize: '32px',
          fontWeight: 600,
          color: '#000000',
          marginBottom: '32px',
          textAlign: 'left',
        }}
      >
        Speaking Section
      </Typography>

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
          In the speaking section, you will answer {totalQuestions} {totalQuestions === 1 ? 'question' : 'questions'} to demonstrate how well you can speak English.
        </Typography>
        <Typography
          sx={{
            fontSize: '16px',
            fontWeight: 400,
            color: '#000000',
            lineHeight: 1.6,
          }}
        >
          There {taskTypes.length === 1 ? 'is' : 'are'} {taskTypes.length === 1 ? 'one' : taskTypes.length === 2 ? 'two' : taskTypes.length === 3 ? 'three' : taskTypes.length} {taskTypes.length === 1 ? 'type' : 'types'} of {taskTypes.length === 1 ? 'task' : 'tasks'}.
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
          border: '1px solid #e0e0e0',
        }}
      >
        <Table sx={{ borderCollapse: 'collapse' }}>
          <TableHead>
            <TableRow
              sx={{
                backgroundColor: '#d3b1aa',
              }}
            >
              <TableCell
                sx={{
                  fontSize: '16px',
                  fontWeight: 600,
                  borderBottom: '1px solid #e0e0e0',
                  padding: '12px 16px',
                  borderRight: '1px solid #e0e0e0',
                }}
              >
                Type of Task
              </TableCell>
              <TableCell
                sx={{
                  fontSize: '16px',
                  fontWeight: 600,
                  borderBottom: '1px solid #e0e0e0',
                  padding: '12px 16px',
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
                    borderBottom: index < taskTypes.length - 1 ? '1px solid #e0e0e0' : 'none',
                    borderRight: '1px solid #e0e0e0',
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
                    borderBottom: index < taskTypes.length - 1 ? '1px solid #e0e0e0' : 'none',
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

export default SpeakingIntro

