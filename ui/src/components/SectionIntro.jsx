import { useMemo, useEffect, useRef } from 'react'
import { Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Divider } from '@mui/material'
import { useVolume } from '../contexts/VolumeContext'
import listeningIntroAudio from '../audios/listeningIntro.mp3'
import speakingIntroAudio from '../audios/speakingIntro.mp3'

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

// Section-specific introductory text
const sectionIntroTexts = {
  reading: {
    firstLine: (totalQuestions) => `In the Reading section, you will answer ${totalQuestions} ${totalQuestions === 1 ? 'question' : 'questions'} to demonstrate how well you understand academic and non-academic texts in English.`,
    secondLine: (taskTypesCount) => `There ${taskTypesCount === 1 ? 'is' : 'are'} ${taskTypesCount === 1 ? 'one' : taskTypesCount === 2 ? 'two' : taskTypesCount === 3 ? 'three' : taskTypesCount} ${taskTypesCount === 1 ? 'type' : 'types'} of ${taskTypesCount === 1 ? 'task' : 'tasks'}.`,
    additionalLine: null
  },
  listening: {
    firstLine: (totalQuestions) => `In the listening section, you will answer ${totalQuestions} ${totalQuestions === 1 ? 'question' : 'questions'} to demonstrate how well you understand spoken English.`,
    secondLine: (taskTypesCount) => `There ${taskTypesCount === 1 ? 'is' : 'are'} ${taskTypesCount === 1 ? 'one' : taskTypesCount === 2 ? 'two' : taskTypesCount === 3 ? 'three' : taskTypesCount} ${taskTypesCount === 1 ? 'type' : 'types'} of ${taskTypesCount === 1 ? 'task' : 'tasks'}.`,
    additionalLine: 'You **WILL NOT** be able to return to previous questions.'
  },
  writing: {
    firstLine: (totalQuestions) => `In the writing section, you will answer ${totalQuestions} ${totalQuestions === 1 ? 'question' : 'questions'} to demonstrate how well you can write in English.`,
    secondLine: (taskTypesCount) => `There ${taskTypesCount === 1 ? 'is' : 'are'} ${taskTypesCount === 1 ? 'one' : taskTypesCount === 2 ? 'two' : taskTypesCount === 3 ? 'three' : taskTypesCount} ${taskTypesCount === 1 ? 'type' : 'types'} of ${taskTypesCount === 1 ? 'task' : 'tasks'}.`,
    additionalLine: null
  },
  speaking: {
    firstLine: (totalQuestions) => `In the speaking section, you will answer ${totalQuestions} ${totalQuestions === 1 ? 'question' : 'questions'} to demonstrate how well you can speak English.`,
    secondLine: (taskTypesCount) => `There ${taskTypesCount === 1 ? 'is' : 'are'} ${taskTypesCount === 1 ? 'one' : taskTypesCount === 2 ? 'two' : taskTypesCount === 3 ? 'three' : taskTypesCount} ${taskTypesCount === 1 ? 'type' : 'types'} of ${taskTypesCount === 1 ? 'task' : 'tasks'}.`,
    additionalLine: null
  }
}

function SectionIntro({ module }) {
  const section = module.section || 'speaking'
  const sectionName = module.sectionName || 'Section'
  const { getVolumeDecimal } = useVolume()
  const audioRef = useRef(null)
  
  // Initialize and play audio for listening and speaking sections
  useEffect(() => {
    if (section === 'listening' || section === 'speaking') {
      const audioFile = section === 'listening' ? listeningIntroAudio : speakingIntroAudio
      const audio = new Audio(audioFile)
      audio.volume = getVolumeDecimal()
      audio.loop = false
      audioRef.current = audio

      // Play audio after 1 second delay
      const startTimer = setTimeout(() => {
        if (audioRef.current) {
          audioRef.current.play().catch(error => {
            console.error('Error playing audio:', error)
          })
        }
      }, 1000)

      // Cleanup on unmount
      return () => {
        clearTimeout(startTimer)
        if (audioRef.current) {
          audioRef.current.pause()
          audioRef.current.currentTime = 0
          audioRef.current = null
        }
      }
    }
  }, [section, getVolumeDecimal])

  // Update audio volume when volume changes
  useEffect(() => {
    if ((section === 'listening' || section === 'speaking') && audioRef.current) {
      audioRef.current.volume = getVolumeDecimal()
    }
  }, [section, getVolumeDecimal])
  
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
  const introText = sectionIntroTexts[section] || sectionIntroTexts.speaking

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
          {introText.firstLine(totalQuestions)}
        </Typography>
        <Typography
          sx={{
            fontSize: '16px',
            fontWeight: 400,
            color: '#000000',
            lineHeight: 1.6,
            marginBottom: introText.additionalLine ? '4px' : 0,
          }}
        >
          {introText.secondLine(taskTypes.length)}
        </Typography>
        {introText.additionalLine && (
          <Typography
            sx={{
              fontSize: '16px',
              fontWeight: 400,
              color: '#000000',
              lineHeight: 1.6,
            }}
          >
            You{' '}
            <Box component="span" sx={{ fontWeight: 700 }}>
              WILL NOT
            </Box>{' '}
            be able to return to previous questions.
          </Typography>
        )}
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

