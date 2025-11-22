import { useState, useMemo, useEffect } from 'react'
import { Box, Typography, Button } from '@mui/material'
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff'
import VisibilityIcon from '@mui/icons-material/Visibility'
import TopNavigation from './TopNavigation'
import SectionIntro from './SectionIntro'
import SectionEnd from './SectionEnd'
import PassageQuestion from './questions/PassageQuestion'
import NoticeQuestion from './questions/NoticeQuestion'
import PostQuestion from './questions/PostQuestion'
import EmailQuestion from './questions/EmailQuestion'
import EmailWriting from './questions/EmailWriting'
import GroupDiscussionWriting from './questions/GroupDiscussionWriting'
import BuildTheSentence from './questions/BuildTheSentence'
import FillInQuestion from './questions/FillInQuestion'
import BestResponseQuestion from './questions/BestResponseQuestion'
import ListenPassageQuestion from './questions/ListenPassageQuestion'
import ListenAndRepeat from './questions/ListenAndRepeat'
import InterviewerQuestion from './questions/InterviewerQuestion'

function ModuleView({ module, assets, userAnswers, onAnswerChange, onComplete }) {
  // Create a list of bundles with their types and question counts
  const bundleList = useMemo(() => {
    return module.questions.map((bundle) => {
      if (bundle.type === 'listenandrepeat') {
        // For ListenAndRepeat: parent (1) + children (childQuestions.length)
        const childCount = bundle.childQuestions ? bundle.childQuestions.length : 0
        return {
          bundle,
          type: bundle.type,
          questionCount: 1 + childCount // Parent + children
        }
      }
      if (bundle.type === 'interviewerquestion') {
        // For InterviewerQuestion: parent (1) + children (InterviewerQuestions.length)
        const childCount = bundle.InterviewerQuestions ? bundle.InterviewerQuestions.length : 0
        return {
          bundle,
          type: bundle.type,
          questionCount: 1 + childCount // Parent + children
        }
      }
      if (bundle.type === 'fillin') {
        // For fillin bundles, they take up only 1 navigation position (all questions shown together)
        return {
          bundle,
          type: bundle.type,
          questionCount: 1
        }
      }
      return {
        bundle,
        type: bundle.type,
        questionCount: bundle.questions ? bundle.questions.length : 0
      }
    })
  }, [module.questions])

  // Flatten all individual questions from bundles into a sequential list (excluding fillin and listenandrepeat)
  const flattenedQuestions = useMemo(() => {
    const questions = []
    let questionNumber = 1
    module.questions.forEach((bundle) => {
      if (bundle.type === 'passage' || bundle.type === 'notice' || bundle.type === 'post' || bundle.type === 'email' || bundle.type === 'emailwriting' || bundle.type === 'groupdiscussionwriting' || bundle.type === 'buildthesentence' || bundle.type === 'bestresponse' || bundle.type === 'listenpassage') {
        // For each sub-question in the bundle, create a flattened question item
        bundle.questions.forEach((subQuestion) => {
          questions.push({
            id: subQuestion.id,
            question: subQuestion,
            bundle: bundle,
            bundleType: bundle.type,
            questionNumber: questionNumber++
          })
        })
      } else if (bundle.type === 'fillin') {
        // For fillin bundles, skip individual questions but track the range
        questionNumber += bundle.questions ? bundle.questions.length : 0
      } else if (bundle.type === 'listenandrepeat') {
        // For ListenAndRepeat, track parent + children but don't add to flattenedQuestions
        // Parent is at index 0, children start at index 1
        questionNumber += 1 + (bundle.childQuestions ? bundle.childQuestions.length : 0)
      } else if (bundle.type === 'interviewerquestion') {
        // For InterviewerQuestion, track parent + children but don't add to flattenedQuestions
        // Parent is at index 0, children start at index 1
        questionNumber += 1 + (bundle.InterviewerQuestions ? bundle.InterviewerQuestions.length : 0)
      }
    })
    return questions
  }, [module.questions])

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(-1) // Start at -1 to show intro for speaking section
  const [showTimer, setShowTimer] = useState(true)
  const [showIntro, setShowIntro] = useState(false)
  const [showEnd, setShowEnd] = useState(false)
  // Store timer states per question ID
  const [questionTimers, setQuestionTimers] = useState({}) // { questionId: { timeRemaining: number, isExpired: boolean } }

  // Check if we should show intro screen (for all sections)
  useEffect(() => {
    if (module.section === 'speaking' || module.section === 'writing' || 
        module.section === 'reading' || module.section === 'listening') {
      setShowIntro(true)
      setCurrentQuestionIndex(-1)
    } else {
      setShowIntro(false)
      setCurrentQuestionIndex(0)
    }
    setShowEnd(false) // Reset end screen when module changes
    setQuestionTimers({}) // Reset all timers when module changes
  }, [module.id, module.section])

  // Find current bundle index based on current question index
  const getCurrentBundleIndex = useMemo(() => {
    let questionCount = 0
    for (let i = 0; i < bundleList.length; i++) {
      const bundle = bundleList[i]
      if (bundle.type === 'fillin' || bundle.type === 'listenandrepeat' || bundle.type === 'interviewerquestion') {
        // For fillin, listenandrepeat, and interviewerquestion bundles, they take up multiple positions
        if (currentQuestionIndex >= questionCount && currentQuestionIndex < questionCount + bundle.questionCount) {
          return i
        }
        questionCount += bundle.questionCount
      } else {
        // For other bundles, each question is a position
        if (currentQuestionIndex >= questionCount && currentQuestionIndex < questionCount + bundle.questionCount) {
          return i
        }
        questionCount += bundle.questionCount
      }
    }
    return 0
  }, [currentQuestionIndex, bundleList])
  const currentBundleIndex = getCurrentBundleIndex
  const currentBundle = bundleList[currentBundleIndex]?.bundle
  
  // Map currentQuestionIndex to flattenedQuestions index (skip fillin, listenandrepeat, and interviewerquestion bundles)
  const getFlattenedQuestionIndex = useMemo(() => {
    if (currentBundle?.type === 'fillin' || currentBundle?.type === 'listenandrepeat' || currentBundle?.type === 'interviewerquestion') {
      return null
    }
    let flattenedIndex = 0
    let navigationIndex = 0
    for (let i = 0; i < bundleList.length; i++) {
      const bundle = bundleList[i]
      if (bundle.type === 'fillin' || bundle.type === 'listenandrepeat' || bundle.type === 'interviewerquestion') {
        if (currentQuestionIndex >= navigationIndex && currentQuestionIndex < navigationIndex + bundle.questionCount) {
          return null // We're on a fillin, listenandrepeat, or interviewerquestion bundle
        }
        navigationIndex += bundle.questionCount
      } else {
        if (currentQuestionIndex >= navigationIndex && currentQuestionIndex < navigationIndex + bundle.questionCount) {
          return flattenedIndex + (currentQuestionIndex - navigationIndex)
        }
        navigationIndex += bundle.questionCount
        flattenedIndex += bundle.questionCount
      }
    }
    return null
  }, [currentQuestionIndex, bundleList, currentBundle])
  
  const currentQuestionItem = getFlattenedQuestionIndex !== null ? flattenedQuestions[getFlattenedQuestionIndex] : null

  // Timer countdown - only for emailwriting and groupdiscussionwriting questions
  const isEmailWriting = currentQuestionItem?.bundleType === 'emailwriting'
  const isGroupDiscussionWriting = currentQuestionItem?.bundleType === 'groupdiscussionwriting'
  const hasTimer = isEmailWriting || isGroupDiscussionWriting
  
  // Get timer duration from bundle/question (default 10 seconds)
  const timerDuration = currentQuestionItem?.bundle?.timerDuration || currentQuestionItem?.question?.timerDuration || 10
  const currentQuestionId = currentQuestionItem?.question?.id

  // Initialize timer for current question if it doesn't exist
  useEffect(() => {
    if (hasTimer && currentQuestionId) {
      setQuestionTimers((prev) => {
        // Only initialize if timer doesn't exist for this question
        if (!prev[currentQuestionId]) {
          return {
            ...prev,
            [currentQuestionId]: {
              timeRemaining: timerDuration,
              isExpired: false,
            },
          }
        }
        return prev
      })
    }
  }, [hasTimer, currentQuestionId, timerDuration])

  // Get current question's timer state
  const currentTimer = currentQuestionId ? questionTimers[currentQuestionId] : null
  const timeRemaining = currentTimer?.timeRemaining ?? 0
  const isTimerExpired = currentTimer?.isExpired ?? false

  // Run all active timers
  useEffect(() => {
    const activeTimerCount = Object.values(questionTimers).filter(
      (timer) => timer && !timer.isExpired && timer.timeRemaining > 0
    ).length

    if (activeTimerCount === 0) {
      return
    }

    const interval = setInterval(() => {
      setQuestionTimers((prev) => {
        const updated = { ...prev }
        let hasChanges = false

        Object.keys(prev).forEach((questionId) => {
          const timer = prev[questionId]
          if (timer && !timer.isExpired && timer.timeRemaining > 0) {
            const newTimeRemaining = timer.timeRemaining - 1
            updated[questionId] = {
              timeRemaining: newTimeRemaining,
              isExpired: newTimeRemaining <= 0,
            }
            hasChanges = true
          }
        })

        return hasChanges ? updated : prev
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [questionTimers])

  const formatTime = (totalSeconds) => {
    const hours = Math.floor(totalSeconds / 3600)
    const mins = Math.floor((totalSeconds % 3600) / 60)
    const secs = totalSeconds % 60
    return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
  }

  const handlePrevious = () => {
    // Check if the current bundle allows going back
    if (currentQuestionItem?.bundle?.allowBack === false) {
      return
    }
    // For fillin bundles, check the bundle's allowBack attribute
    if (currentBundle?.allowBack === false) {
      return
    }
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1)
    }
  }

  const handleNext = () => {
    // For ListenAndRepeat and InterviewerQuestion, disable Next button completely
    if (currentBundle?.type === 'listenandrepeat' || currentBundle?.type === 'interviewerquestion') {
      return
    }
    // Check if current question requires an answer before proceeding
    if (currentQuestionItem?.question?.required) {
      const questionId = currentQuestionItem.question.id
      const hasAnswer = userAnswers[questionId] !== undefined && userAnswers[questionId] !== null
      if (!hasAnswer) {
        // Don't proceed if required question is not answered
        return
      }
    }
    
    // For fillin bundles, check if all required questions are answered
    if (currentBundle?.type === 'fillin' && currentBundle.questions) {
      const requiredQuestions = currentBundle.questions.filter(q => q.required === true)
      const allRequiredAnswered = requiredQuestions.every(q => {
        const answer = userAnswers[q.id]
        // Check that answer exists, is not null, and is not an empty string
        return answer !== undefined && answer !== null && answer !== ''
      })
      if (requiredQuestions.length > 0 && !allRequiredAnswered) {
        // Don't proceed if required questions are not answered
        return
      }
    }

    // Calculate total navigation items
    const totalItems = bundleList.reduce((sum, bundle) => {
      return sum + bundle.questionCount
    }, 0)

    if (currentQuestionIndex < totalItems - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
    } else {
      // On the last question, show the end screen
      setShowEnd(true)
    }
  }

  const handleAnswerChange = (questionId, answer) => {
    onAnswerChange(questionId, answer)
  }

  const handleVolumeClick = () => {
    // Volume control logic can be added here
    console.log('Volume button clicked')
  }

  // Calculate navigation state
  const canGoPrevious = useMemo(() => {
    // For ListenAndRepeat and InterviewerQuestion, disable Previous button completely
    if (currentBundle?.type === 'listenandrepeat' || currentBundle?.type === 'interviewerquestion') {
      return false
    }
    // Check if the current bundle allows going back
    if (currentQuestionItem?.bundle?.allowBack === false) {
      return false
    }
    // For fillin bundles, check the bundle's allowBack attribute
    if (currentBundle?.allowBack === false) {
      return false
    }
    return currentQuestionIndex > 0
  }, [currentQuestionIndex, currentQuestionItem, currentBundle])

  const canGoNext = useMemo(() => {
    // For ListenAndRepeat and InterviewerQuestion, disable Next button completely
    if (currentBundle?.type === 'listenandrepeat' || currentBundle?.type === 'interviewerquestion') {
      return false
    }
    // Check if current question requires an answer
    if (currentQuestionItem?.question?.required) {
      const questionId = currentQuestionItem.question.id
      const hasAnswer = userAnswers[questionId] !== undefined && userAnswers[questionId] !== null
      if (!hasAnswer) {
        return false
      }
    }
    
    // For fillin bundles, check if all required questions are answered
    if (currentBundle?.type === 'fillin' && currentBundle.questions) {
      const requiredQuestions = currentBundle.questions.filter(q => q.required === true)
      const allRequiredAnswered = requiredQuestions.every(q => {
        const answer = userAnswers[q.id]
        // Check that answer exists, is not null, and is not an empty string
        return answer !== undefined && answer !== null && answer !== ''
      })
      if (requiredQuestions.length > 0 && !allRequiredAnswered) {
        return false
      }
    }
    
    // Always enable Next button - on last question it will complete the module
    return true
  }, [currentQuestionIndex, bundleList, currentQuestionItem, currentBundle, userAnswers])

  // Calculate total number of actual questions (not navigation positions)
  const getTotalActualQuestions = useMemo(() => {
    let total = 0
    bundleList.forEach((bundle) => {
      if (bundle.type === 'listenandrepeat') {
        // Count only child questions (parent is intro)
        total += bundle.bundle.childQuestions ? bundle.bundle.childQuestions.length : 0
      } else if (bundle.type === 'interviewerquestion') {
        // Count only InterviewerQuestions (parent is intro)
        total += bundle.bundle.InterviewerQuestions ? bundle.bundle.InterviewerQuestions.length : 0
      } else if (bundle.type === 'fillin') {
        // Count all questions in the fillin bundle
        total += bundle.bundle.questions ? bundle.bundle.questions.length : 0
      } else {
        // For other bundles, count questions
        total += bundle.questionCount
      }
    })
    return total
  }, [bundleList])

  // Calculate question range for display
  const getQuestionRange = () => {
    if (currentBundle?.type === 'fillin') {
      // For fillin bundles, calculate the actual question numbers based on position
      // Count all questions that come before this fillin bundle
      let questionNumber = 1
      for (let i = 0; i < currentBundleIndex; i++) {
        const bundle = bundleList[i]
        if (bundle.type === 'listenandrepeat') {
          questionNumber += bundle.bundle.childQuestions ? bundle.bundle.childQuestions.length : 0
        } else if (bundle.type === 'interviewerquestion') {
          questionNumber += bundle.bundle.InterviewerQuestions ? bundle.bundle.InterviewerQuestions.length : 0
        } else if (bundle.type === 'fillin') {
          questionNumber += bundle.bundle.questions ? bundle.bundle.questions.length : 0
        } else {
          questionNumber += bundle.questionCount
        }
      }
      // The fillin bundle starts at questionNumber and ends at questionNumber + count - 1
      const firstQuestion = questionNumber
      const lastQuestion = questionNumber + currentBundle.questions.length - 1
      return `Questions ${firstQuestion}-${lastQuestion}`
    } else if (currentBundle?.type === 'listenandrepeat' || currentBundle?.type === 'interviewerquestion') {
      // For ListenAndRepeat and InterviewerQuestion, parent (position 0) is not a question - it's an intro
      // Only children are actual questions
      let positionInBundle = currentQuestionIndex
      for (let i = 0; i < currentBundleIndex; i++) {
        positionInBundle -= bundleList[i].questionCount
      }
      
      // Calculate the starting question number (x) - previous questions + 1
      let questionNumber = 1
      for (let i = 0; i < currentBundleIndex; i++) {
        const bundle = bundleList[i]
        if (bundle.type === 'listenandrepeat') {
          questionNumber += bundle.bundle.childQuestions ? bundle.bundle.childQuestions.length : 0
        } else if (bundle.type === 'interviewerquestion') {
          questionNumber += bundle.bundle.InterviewerQuestions ? bundle.bundle.InterviewerQuestions.length : 0
        } else if (bundle.type === 'fillin') {
          questionNumber += bundle.bundle.questions ? bundle.bundle.questions.length : 0
        } else {
          questionNumber += bundle.questionCount
        }
      }
      
      // Get child questions array
      const childQuestions = currentBundle.type === 'listenandrepeat' 
        ? currentBundle.childQuestions 
        : currentBundle.InterviewerQuestions
      const totalChildQuestions = childQuestions ? childQuestions.length : 0
      
      if (positionInBundle === 0) {
        // Parent/intro - show "Questions x-y" where x is starting index, y is x + totalChildQuestions - 1
        const lastQuestion = questionNumber + totalChildQuestions - 1
        if (totalChildQuestions > 1) {
          return `Questions ${questionNumber}-${lastQuestion}`
        } else {
          return `Question ${questionNumber}`
        }
      } else {
        // Child question - show "Question x" where x is the specific child question number
        // positionInBundle - 1 gives us the child index (0-indexed), so we add it to questionNumber
        const childQuestionNumber = questionNumber + (positionInBundle - 1)
        
        return `Question ${childQuestionNumber} of ${getTotalActualQuestions}`
      }
    } else {
      // For regular questions, show "Question X of Y"
      // Calculate current question number
      let currentQuestionNumber = 1
      for (let i = 0; i < currentBundleIndex; i++) {
        const bundle = bundleList[i]
        if (bundle.type === 'listenandrepeat') {
          currentQuestionNumber += bundle.bundle.childQuestions ? bundle.bundle.childQuestions.length : 0
        } else if (bundle.type === 'interviewerquestion') {
          currentQuestionNumber += bundle.bundle.InterviewerQuestions ? bundle.bundle.InterviewerQuestions.length : 0
        } else if (bundle.type === 'fillin') {
          currentQuestionNumber += bundle.bundle.questions ? bundle.bundle.questions.length : 0
        } else {
          currentQuestionNumber += bundle.questionCount
        }
      }
      // Add the position within the current bundle
      let positionInBundle = currentQuestionIndex
      for (let i = 0; i < currentBundleIndex; i++) {
        positionInBundle -= bundleList[i].questionCount
      }
      currentQuestionNumber += positionInBundle
      
      return `Question ${currentQuestionNumber} of ${getTotalActualQuestions}`
    }
  }

  const handleIntroContinue = () => {
    setShowIntro(false)
    setCurrentQuestionIndex(0)
  }

  const handleEndNext = () => {
    onComplete()
  }

  // Show end screen when all questions are completed
  if (showEnd) {
    return (
      <SectionEnd
        sectionName={module.sectionName}
        onNext={handleEndNext}
      />
    )
  }

  // Show intro screen for all sections
  if (showIntro && (module.section === 'speaking' || module.section === 'writing' || 
      module.section === 'reading' || module.section === 'listening')) {
    return (
      <Box className="min-h-screen bg-white">
        {/* Top Navigation Bar with Begin button */}
        <Box
          sx={{
            backgroundColor: '#008080',
            width: '100%',
            padding: '12px 24px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            minHeight: '56px',
          }}
        >
          <Typography
            sx={{
              fontSize: '16px',
              fontWeight: 400,
              color: '#ffffff',
              fontFamily: 'inherit',
            }}
          >
            {module.sectionName}
          </Typography>
          <Button
            onClick={handleIntroContinue}
            sx={{
              border: '1px solid white',
              backgroundColor: '#008080',
              color: 'white',
              borderRadius: '8px',
              padding: '8px 24px',
              textTransform: 'none',
              fontSize: '14px',
              fontWeight: 500,
              minWidth: 'auto',
              boxShadow: 'none',
              '&:hover': {
                backgroundColor: '#006666',
                boxShadow: 'none',
              },
            }}
          >
            Begin
          </Button>
        </Box>

        {/* Main Content - Intro Screen */}
        <Box
          sx={{
            maxWidth: '1400px',
            margin: '0 auto',
            padding: '0',
            height: 'calc(100vh - 120px)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          <SectionIntro module={module} />
        </Box>
      </Box>
    )
  }

  return (
    <Box className="min-h-screen bg-white">
      {/* Top Navigation Bar */}
      <TopNavigation
        onPrevious={handlePrevious}
        onNext={handleNext}
        canGoPrevious={canGoPrevious}
        canGoNext={canGoNext}
        onVolumeClick={handleVolumeClick}
      />

      {/* Section Header */}
      <Box
        sx={{
          backgroundColor: 'white',
          padding: '4px 24px',
          borderBottom: '1px solid #e0e0e0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Typography
          sx={{
            fontSize: '16px',
            fontWeight: 400,
            color: '#424242', // Dark gray - matching screenshot
            fontFamily: 'inherit',
          }}
        >
          {module.sectionName} | {getQuestionRange()}
        </Typography>
        
        {/* Timer - only show for questions with timer */}
        {hasTimer && showTimer && (
          <Box sx={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <Typography
              sx={{
                fontSize: '16px',
                fontWeight: 400,
                color: '#424242',
                fontFamily: 'inherit',
              }}
            >
              {formatTime(timeRemaining)}
            </Typography>
            <Button
              onClick={() => setShowTimer(false)}
              sx={{
                color: '#008080',
                textTransform: 'none',
                minWidth: 'auto',
                padding: '4px 8px',
                fontSize: '14px',
                '&:hover': {
                  backgroundColor: 'rgba(0, 128, 128, 0.04)',
                },
              }}
              startIcon={<VisibilityOffIcon sx={{ fontSize: '18px', color: '#008080' }} />}
            >
              Hide Time
            </Button>
          </Box>
        )}
        {hasTimer && !showTimer && (
          <Button
            onClick={() => setShowTimer(true)}
            sx={{
              color: '#008080',
              textTransform: 'none',
              minWidth: 'auto',
              padding: '4px 8px',
              fontSize: '14px',
              '&:hover': {
                backgroundColor: 'rgba(0, 128, 128, 0.04)',
              },
            }}
            startIcon={<VisibilityIcon sx={{ fontSize: '18px', color: '#008080' }} />}
          >
            Show Time
          </Button>
        )}
      </Box>

      {/* Main Content */}
      <Box
        sx={{
          maxWidth: '1400px',
          margin: '0 auto',
          padding: '24px',
          height: 'calc(100vh - 120px)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {currentBundle?.type === 'fillin' && (
          <FillInQuestion
            bundle={currentBundle}
            questions={currentBundle.questions}
            userAnswers={userAnswers}
            onAnswerChange={handleAnswerChange}
            questionRange={getQuestionRange()}
          />
        )}
        {currentBundle?.type === 'listenandrepeat' && (() => {
          // Calculate which position we're at within this bundle
          let positionInBundle = currentQuestionIndex
          for (let i = 0; i < currentBundleIndex; i++) {
            positionInBundle -= bundleList[i].questionCount
          }
          // Position 0 is parent, positions 1+ are children (0-indexed)
          const isParent = positionInBundle === 0
          const childIndex = isParent ? -1 : positionInBundle - 1
          
          return (
            <ListenAndRepeat
              bundle={currentBundle}
              assets={assets}
              isParent={isParent}
              currentChildIndex={childIndex}
              onNextChild={() => {
                // Move to next child or next bundle
                const nextIndex = currentQuestionIndex + 1
                const totalItems = bundleList.reduce((sum, bundle) => sum + bundle.questionCount, 0)
                if (nextIndex < totalItems) {
                  setCurrentQuestionIndex(nextIndex)
                } else {
                  setShowEnd(true)
                }
              }}
            />
          )
        })()}
        {currentBundle?.type === 'interviewerquestion' && (() => {
          // Calculate which position we're at within this bundle
          let positionInBundle = currentQuestionIndex
          for (let i = 0; i < currentBundleIndex; i++) {
            positionInBundle -= bundleList[i].questionCount
          }
          // Position 0 is parent, positions 1+ are children (0-indexed)
          const isParent = positionInBundle === 0
          const childIndex = isParent ? -1 : positionInBundle - 1
          
          return (
            <InterviewerQuestion
              bundle={currentBundle}
              assets={assets}
              isParent={isParent}
              currentChildIndex={childIndex}
              onNextChild={() => {
                // Move to next child or next bundle
                const nextIndex = currentQuestionIndex + 1
                const totalItems = bundleList.reduce((sum, bundle) => sum + bundle.questionCount, 0)
                if (nextIndex < totalItems) {
                  setCurrentQuestionIndex(nextIndex)
                } else {
                  setShowEnd(true)
                }
              }}
            />
          )
        })()}
        {currentQuestionItem && (
          <>
            {currentQuestionItem.bundleType === 'passage' && (
              <PassageQuestion
                bundle={currentQuestionItem.bundle}
                question={currentQuestionItem.question}
                userAnswers={userAnswers}
                onAnswerChange={handleAnswerChange}
              />
            )}
            {currentQuestionItem.bundleType === 'notice' && (
              <NoticeQuestion
                bundle={currentQuestionItem.bundle}
                question={currentQuestionItem.question}
                userAnswers={userAnswers}
                onAnswerChange={handleAnswerChange}
              />
            )}
            {currentQuestionItem.bundleType === 'post' && (
              <PostQuestion
                bundle={currentQuestionItem.bundle}
                question={currentQuestionItem.question}
                userAnswers={userAnswers}
                onAnswerChange={handleAnswerChange}
              />
            )}
            {currentQuestionItem.bundleType === 'email' && (
              <EmailQuestion
                bundle={currentQuestionItem.bundle}
                question={currentQuestionItem.question}
                userAnswers={userAnswers}
                onAnswerChange={handleAnswerChange}
              />
            )}
            {currentQuestionItem.bundleType === 'emailwriting' && (
              <EmailWriting
                bundle={currentQuestionItem.bundle}
                question={currentQuestionItem.question}
                userAnswers={userAnswers}
                onAnswerChange={handleAnswerChange}
                isTimerExpired={isTimerExpired}
              />
            )}
            {currentQuestionItem.bundleType === 'groupdiscussionwriting' && (
              <GroupDiscussionWriting
                bundle={currentQuestionItem.bundle}
                question={currentQuestionItem.question}
                userAnswers={userAnswers}
                onAnswerChange={handleAnswerChange}
                isTimerExpired={isTimerExpired}
                assets={assets}
              />
            )}
            {currentQuestionItem.bundleType === 'buildthesentence' && (
              <BuildTheSentence
                bundle={currentQuestionItem.bundle}
                question={currentQuestionItem.question}
                userAnswers={userAnswers}
                onAnswerChange={handleAnswerChange}
                assets={assets}
              />
            )}
            {currentQuestionItem.bundleType === 'bestresponse' && (
              <BestResponseQuestion
                bundle={currentQuestionItem.bundle}
                question={currentQuestionItem.question}
                assets={assets}
                userAnswers={userAnswers}
                onAnswerChange={handleAnswerChange}
              />
            )}
            {currentQuestionItem.bundleType === 'listenpassage' && (
              <ListenPassageQuestion
                bundle={currentQuestionItem.bundle}
                question={currentQuestionItem.question}
                assets={assets}
                userAnswers={userAnswers}
                onAnswerChange={handleAnswerChange}
                onNavigateToFirstQuestion={() => {
                  // Find the currentQuestionIndex for the first question in this bundle
                  // We need to count all navigation positions before this bundle
                  let navigationIndex = 0
                  for (let i = 0; i < bundleList.length; i++) {
                    const bundle = bundleList[i]
                    if (bundle.bundle.id === currentQuestionItem.bundle.id) {
                      // Found the bundle - the first question is at this navigationIndex
                      setCurrentQuestionIndex(navigationIndex)
                      return
                    }
                    if (bundle.type === 'fillin') {
                      // Fillin bundles take 1 position
                      navigationIndex++
                    } else {
                      // Other bundles take questionCount positions
                      navigationIndex += bundle.questionCount
                    }
                  }
                }}
              />
            )}
          </>
        )}
      </Box>

      {/* Bottom Bar */}
      <Box
        sx={{
          position: 'fixed',
          bottom: 0,
          right: 0,
          padding: '8px 16px',
          backgroundColor: '#f5f5f5',
          borderTop: '1px solid #e0e0e0',
          borderLeft: '1px solid #e0e0e0',
        }}
      >
      </Box>
    </Box>
  )
}

export default ModuleView

