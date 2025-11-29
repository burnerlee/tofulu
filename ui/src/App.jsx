import { useState } from 'react'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import { Box, Typography, Button } from '@mui/material'
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
import testData from './data/testData.json'

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
  const [currentView, setCurrentView] = useState('welcome')
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0)
  const [currentModuleIndex, setCurrentModuleIndex] = useState(0)
  const [userAnswers, setUserAnswers] = useState({})

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

