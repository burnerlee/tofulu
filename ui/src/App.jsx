import { useState, useEffect } from 'react'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import { Box, Typography, Button, CircularProgress, Alert } from '@mui/material'
import { VolumeProvider } from './contexts/VolumeContext'
import WelcomePage from './components/WelcomePage'
import HardwareCheck from './components/HardwareCheck'
import VolumeAdjustment from './components/VolumeAdjustment'
import MicrophoneAdjustment from './components/MicrophoneAdjustment'
import SetupPage from './components/SetupPage'
import ModuleView from './components/ModuleView'
import SectionIntro from './components/SectionIntro'
import SectionEnd from './components/SectionEnd'
import ModuleStart from './components/ModuleStart'
import ModuleEnd from './components/ModuleEnd'

// Backend API base URL
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
})

function App() {
  const [currentView, setCurrentView] = useState('loading')
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0)
  const [currentModuleIndex, setCurrentModuleIndex] = useState(0)
  const [userAnswers, setUserAnswers] = useState({})
  const [testData, setTestData] = useState(null)
  const [loadingError, setLoadingError] = useState(null)

  // Get test ID and token from URL query parameters
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const testId = urlParams.get('test')
    const tokenFromUrl = urlParams.get('token')

    // Clean up URL by removing both token and test ID after reading them
    const newParams = new URLSearchParams(window.location.search)
    let urlChanged = false

    // If token is provided in URL, store it in localStorage (platform's own localStorage)
    if (tokenFromUrl) {
      // Store token in platform's localStorage
      localStorage.setItem('auth_token', tokenFromUrl)
      console.log('Token stored in platform localStorage')
      newParams.delete('token')
      urlChanged = true
    }

    // Remove test ID from URL after reading it
    if (testId) {
      newParams.delete('test')
      urlChanged = true
    }

    // Update URL to remove token and test ID (using replaceState so it doesn't add to history)
    if (urlChanged) {
      const newUrl = newParams.toString() 
        ? `${window.location.pathname}?${newParams.toString()}`
        : window.location.pathname
      window.history.replaceState({}, '', newUrl)
    }

    if (testId) {
      // Fetch test data from backend (will use token from localStorage)
      fetchTestData(parseInt(testId))
    } else {
      // No test ID provided - test must be accessed from dashboard
      setLoadingError('No test specified. Please start a test from the dashboard.')
    }
  }, [])

  // Add reload warning when test is in progress
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      // Only show warning if test has started (not on welcome/loading screen)
      // Check if user has made progress or is past the welcome screen
      const testInProgress = 
        currentView !== 'loading' && 
        currentView !== 'welcome' && 
        currentView !== 'complete' &&
        testData !== null

      if (testInProgress) {
        // Modern browsers ignore custom messages, but we can set returnValue
        e.preventDefault()
        // Chrome requires returnValue to be set
        e.returnValue = ''
        // Return a message (though most browsers will show their own)
        return 'Are you sure you want to leave? Your test progress will be lost.'
      }
    }

    // Add event listener
    window.addEventListener('beforeunload', handleBeforeUnload)

    // Cleanup on unmount
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [currentView, testData])

  const fetchTestData = async (testId) => {
    try {
      // Get authentication token from platform's localStorage
      // This token was either:
      // 1. Passed from landing page via URL query parameter and stored above
      // 2. Already stored from a previous session on this domain
      const token = localStorage.getItem('auth_token')

      if (!token) {
        setLoadingError('Authentication required. Please log in from the landing page first.')
        return
      }

      console.log('Using token from platform localStorage for API request')

      const response = await fetch(`${API_BASE_URL}/api/v1/tests/${testId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        if (response.status === 401) {
          setLoadingError('Authentication failed. Please log in again.')
        } else if (response.status === 403) {
          setLoadingError('You do not have access to this test. Premium subscription required.')
        } else if (response.status === 404) {
          setLoadingError(`Test ${testId} not found.`)
        } else {
          setLoadingError('Failed to load test data. Please try again.')
        }
        return
      }

      const data = await response.json()
      setTestData(data)
      setCurrentView('welcome')
    } catch (error) {
      console.error('Error fetching test data:', error)
      setLoadingError('Network error. Please check your connection and try again.')
    }
  }

  const handleWelcomeContinue = () => {
    setCurrentView('hardware-check')
  }

  const handleHardwareCheckComplete = () => {
    setCurrentView('volume-adjustment')
  }

  const handleVolumeAdjustmentComplete = () => {
    setCurrentView('microphone-adjustment')
  }

  const handleMicrophoneAdjustmentComplete = () => {
    setCurrentView('section-intro')
    setCurrentSectionIndex(0)
    setCurrentModuleIndex(0)
  }

  const handleSectionIntroComplete = () => {
    const currentSection = testData.sections[currentSectionIndex]
    // For reading and listening sections, show module start first
    if (currentSection && (currentSection.section === 'reading' || currentSection.section === 'listening')) {
      setCurrentView('module-start')
    } else {
      setCurrentView('module')
    }
  }

  const handleModuleStartComplete = () => {
    setCurrentView('module')
  }

  const handleModuleComplete = () => {
    const currentSection = testData.sections[currentSectionIndex]
    if (!currentSection) {
      setCurrentView('complete')
      return
    }

    // For reading and listening sections, show module end first
    if (currentSection.section === 'reading' || currentSection.section === 'listening') {
      setCurrentView('module-end')
    } else {
      // For other sections, check if there are more modules
      if (currentModuleIndex < currentSection.modules.length - 1) {
        setCurrentModuleIndex(currentModuleIndex + 1)
      } else {
        // Current section is complete, show section end
        setCurrentView('section-end')
      }
    }
  }

  const handleModuleEndComplete = () => {
    const currentSection = testData.sections[currentSectionIndex]
    if (!currentSection) {
      setCurrentView('complete')
      return
    }

    // Check if there are more modules in the current section
    if (currentModuleIndex < currentSection.modules.length - 1) {
      setCurrentModuleIndex(currentModuleIndex + 1)
      // For reading and listening sections, show next module start
      if (currentSection.section === 'reading' || currentSection.section === 'listening') {
        setCurrentView('module-start')
      } else {
        setCurrentView('module')
      }
    } else {
      // Current section is complete, show section end
      setCurrentView('section-end')
    }
  }

  const handleSectionEndComplete = () => {
    // Move to next section
    if (currentSectionIndex < testData.sections.length - 1) {
      setCurrentSectionIndex(currentSectionIndex + 1)
      setCurrentModuleIndex(0)
      setCurrentView('section-intro')
    } else {
      // All sections completed
      setCurrentView('complete')
    }
  }

  const updateAnswer = (questionId, answer) => {
    setUserAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }))
  }

  // Show loading state
  if (currentView === 'loading') {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            backgroundColor: '#F5F5F5',
            padding: '24px',
            gap: loadingError ? 3 : 2,
          }}
        >
          {loadingError ? (
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                maxWidth: '440px',
                width: '100%',
                animation: 'fadeInUp 0.8s ease-out',
                '@keyframes fadeInUp': {
                  from: {
                    opacity: 0,
                    transform: 'translateY(30px)',
                  },
                  to: {
                    opacity: 1,
                    transform: 'translateY(0)',
                  },
                },
              }}
            >
              {/* Error Message Box */}
              <Box
                sx={{
                  width: '100%',
                  backgroundColor: 'rgba(220, 53, 69, 0.1)',
                  border: '1px solid rgba(220, 53, 69, 0.2)',
                  borderRadius: '8px',
                  padding: '16px',
                  marginBottom: '24px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                }}
              >
                <Box
                  sx={{
                    minWidth: '24px',
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    backgroundColor: '#dc3545',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ffffff',
                    fontSize: '16px',
                    fontWeight: 'bold',
                    flexShrink: 0,
                  }}
                >
                  !
                </Box>
                <Typography
                  sx={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize: '16px',
                    fontWeight: 400,
                    color: '#B32626',
                    lineHeight: 1.5,
                    flex: 1,
                  }}
                >
                  {loadingError}
                </Typography>
              </Box>

              {/* Go to Login Button */}
              <Button
                onClick={() => {
                  // Redirect to landing page login
                  const landingUrl = import.meta.env.VITE_LANDING_URL || 'http://localhost:5173'
                  window.location.href = `${landingUrl}/login`
                }}
                sx={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: '18px',
                  fontWeight: 500,
                  color: '#ffffff',
                  backgroundColor: '#086A6F',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '16px 32px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 2px 8px rgba(8, 106, 111, 0.2)',
                  width: '100%',
                  textTransform: 'none',
                  '&:hover': {
                    backgroundColor: '#065559',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 4px 12px rgba(8, 106, 111, 0.3)',
                  },
                  '&:active': {
                    transform: 'translateY(0)',
                  },
                }}
              >
                GO TO LOGIN
                <Box
                  component="span"
                  sx={{
                    fontSize: '20px',
                    transition: 'transform 0.3s ease',
                    '&:hover': {
                      transform: 'translateX(4px)',
                    },
                  }}
                >
                  →
                </Box>
              </Button>
            </Box>
          ) : (
            <>
              <CircularProgress sx={{ color: '#086A6F' }} />
              <Typography
                sx={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: '16px',
                  color: '#000000',
                }}
              >
                Loading test data...
              </Typography>
            </>
          )}
        </Box>
      </ThemeProvider>
    )
  }

  // Don't render anything if testData is not loaded
  if (!testData) {
    return null
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <VolumeProvider>
        {currentView === 'welcome' && (
          <WelcomePage onContinue={handleWelcomeContinue} />
        )}

        {currentView === 'hardware-check' && (
          <HardwareCheck onContinue={handleHardwareCheckComplete} />
        )}

        {currentView === 'volume-adjustment' && (
          <VolumeAdjustment onContinue={handleVolumeAdjustmentComplete} />
        )}

        {currentView === 'microphone-adjustment' && (
          <MicrophoneAdjustment onContinue={handleMicrophoneAdjustmentComplete} />
        )}

        {currentView === 'section-intro' && testData.sections[currentSectionIndex] && (
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
                {testData.sections[currentSectionIndex].sectionName}
              </Typography>
              <Button
                onClick={handleSectionIntroComplete}
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
              <SectionIntro 
                module={{
                  ...testData.sections[currentSectionIndex].modules[currentModuleIndex],
                  section: testData.sections[currentSectionIndex].section,
                  sectionName: testData.sections[currentSectionIndex].sectionName
                }} 
              />
            </Box>
          </Box>
        )}

        {currentView === 'module-start' && testData.sections[currentSectionIndex] && testData.sections[currentSectionIndex].modules[currentModuleIndex] && (
          <ModuleStart
            moduleNumber={testData.sections[currentSectionIndex].modules[currentModuleIndex].moduleNumber || currentModuleIndex + 1}
            sectionName={testData.sections[currentSectionIndex].sectionName}
            section={testData.sections[currentSectionIndex].section}
            module={testData.sections[currentSectionIndex].modules[currentModuleIndex]}
            onContinue={handleModuleStartComplete}
          />
        )}

        {currentView === 'module-end' && testData.sections[currentSectionIndex] && testData.sections[currentSectionIndex].modules[currentModuleIndex] && (
          <ModuleEnd
            moduleNumber={testData.sections[currentSectionIndex].modules[currentModuleIndex].moduleNumber || currentModuleIndex + 1}
            nextModuleNumber={
              currentModuleIndex < testData.sections[currentSectionIndex].modules.length - 1
                ? (testData.sections[currentSectionIndex].modules[currentModuleIndex + 1]?.moduleNumber || currentModuleIndex + 2)
                : null
            }
            sectionName={testData.sections[currentSectionIndex].sectionName}
            section={testData.sections[currentSectionIndex].section}
            onNext={handleModuleEndComplete}
          />
        )}

        {currentView === 'module' && testData.sections[currentSectionIndex] && testData.sections[currentSectionIndex].modules[currentModuleIndex] && (
          <ModuleView
            module={{
              ...testData.sections[currentSectionIndex].modules[currentModuleIndex],
              section: testData.sections[currentSectionIndex].section,
              sectionName: testData.sections[currentSectionIndex].sectionName
            }}
            assets={testData.assets || {}}
            userAnswers={userAnswers}
            onAnswerChange={updateAnswer}
            onComplete={handleModuleComplete}
            skipIntro={true}
          />
        )}

        {currentView === 'section-end' && testData.sections[currentSectionIndex] && (
          <SectionEnd
            sectionName={testData.sections[currentSectionIndex].sectionName}
            onNext={handleSectionEndComplete}
          />
        )}

        {currentView === 'complete' && (
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
              <h1 className="text-2xl font-bold mb-4">Test Complete!</h1>
              <p>Thank you for completing the test.</p>
            </div>
          </div>
        )}
      </VolumeProvider>
    </ThemeProvider>
  )
}

export default App

