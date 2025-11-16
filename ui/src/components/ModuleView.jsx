import { useState, useMemo } from 'react'
import { Box, Typography } from '@mui/material'
import TopNavigation from './TopNavigation'
import PassageQuestion from './questions/PassageQuestion'
import NoticeQuestion from './questions/NoticeQuestion'
import PostQuestion from './questions/PostQuestion'
import EmailQuestion from './questions/EmailQuestion'
import FillInQuestion from './questions/FillInQuestion'

function ModuleView({ module, userAnswers, onAnswerChange, onComplete }) {
  // Create a list of bundles with their types and question counts
  const bundleList = useMemo(() => {
    return module.questions.map((bundle) => ({
      bundle,
      type: bundle.type,
      questionCount: bundle.questions ? bundle.questions.length : 0
    }))
  }, [module.questions])

  // Flatten all individual questions from bundles into a sequential list (excluding fillin)
  const flattenedQuestions = useMemo(() => {
    const questions = []
    let questionNumber = 1
    module.questions.forEach((bundle) => {
      if (bundle.type === 'passage' || bundle.type === 'notice' || bundle.type === 'post' || bundle.type === 'email') {
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
      }
    })
    return questions
  }, [module.questions])

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)

  // Find current bundle index based on current question index
  const getCurrentBundleIndex = useMemo(() => {
    let questionCount = 0
    for (let i = 0; i < bundleList.length; i++) {
      const bundle = bundleList[i]
      if (bundle.type === 'fillin') {
        // For fillin bundles, they take up one "position" in navigation
        if (questionCount === currentQuestionIndex) {
          return i
        }
        questionCount++
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
  
  // Map currentQuestionIndex to flattenedQuestions index (skip fillin bundles)
  const getFlattenedQuestionIndex = useMemo(() => {
    if (currentBundle?.type === 'fillin') {
      return null
    }
    let flattenedIndex = 0
    let navigationIndex = 0
    for (let i = 0; i < bundleList.length; i++) {
      const bundle = bundleList[i]
      if (bundle.type === 'fillin') {
        if (navigationIndex === currentQuestionIndex) {
          return null // We're on a fillin bundle
        }
        navigationIndex++
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

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1)
    }
  }

  const handleNext = () => {
    // Calculate total navigation items
    const totalItems = bundleList.reduce((sum, bundle) => {
      if (bundle.type === 'fillin') {
        return sum + 1
      }
      return sum + bundle.questionCount
    }, 0)

    if (currentQuestionIndex < totalItems - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
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
    return currentQuestionIndex > 0
  }, [currentQuestionIndex])

  const canGoNext = useMemo(() => {
    const totalQuestions = bundleList.reduce((sum, bundle) => {
      if (bundle.type === 'fillin') {
        return sum + 1
      }
      return sum + bundle.questionCount
    }, 0)
    return currentQuestionIndex < totalQuestions - 1
  }, [currentQuestionIndex, bundleList])

  // Calculate question range for display
  const getQuestionRange = () => {
    if (currentBundle?.type === 'fillin') {
      // For fillin bundles, calculate the actual question numbers based on position
      // Count all questions that come before this fillin bundle
      let questionNumber = 1
      for (let i = 0; i < currentBundleIndex; i++) {
        const bundle = bundleList[i]
        if (bundle.type === 'fillin') {
          // Fillin bundles contribute their question count to the sequence
          questionNumber += bundle.questionCount
        } else {
          // Regular bundles contribute their question count
          questionNumber += bundle.questionCount
        }
      }
      // The fillin bundle starts at questionNumber and ends at questionNumber + count - 1
      const firstQuestion = questionNumber
      const lastQuestion = questionNumber + currentBundle.questions.length - 1
      return `Questions ${firstQuestion}-${lastQuestion}`
    } else {
      // For regular questions, show "Question X of Y"
      const current = currentQuestionIndex + 1
      const total = bundleList.reduce((sum, bundle) => {
        if (bundle.type === 'fillin') {
          return sum + 1
        }
        return sum + bundle.questionCount
      }, 0)
      return `Question ${current} of ${total}`
    }
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
      </Box>

      {/* Main Content */}
      <Box
        sx={{
          maxWidth: '1400px',
          margin: '0 auto',
          padding: '24px',
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
          </>
        )}
      </Box>
    </Box>
  )
}

export default ModuleView

