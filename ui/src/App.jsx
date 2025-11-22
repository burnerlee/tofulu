import { useState, useEffect } from 'react'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import { VolumeProvider } from './contexts/VolumeContext'
import WelcomePage from './components/WelcomePage'
import HardwareCheck from './components/HardwareCheck'
import VolumeAdjustment from './components/VolumeAdjustment'
import MicrophoneAdjustment from './components/MicrophoneAdjustment'
import SetupPage from './components/SetupPage'
import ModuleView from './components/ModuleView'
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
    setCurrentView('module')
    setCurrentModuleIndex(0)
  }

  const handleModuleComplete = () => {
    if (currentModuleIndex < testData.modules.length - 1) {
      setCurrentModuleIndex(currentModuleIndex + 1)
    } else {
      // All modules completed
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

        {currentView === 'module' && testData.modules[currentModuleIndex] && (
          <ModuleView
            module={testData.modules[currentModuleIndex]}
            assets={testData.assets || {}}
            userAnswers={userAnswers}
            onAnswerChange={updateAnswer}
            onComplete={handleModuleComplete}
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

