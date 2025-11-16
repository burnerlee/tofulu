import { useState, useEffect } from 'react'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
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
  const [currentView, setCurrentView] = useState('setup')
  const [currentModuleIndex, setCurrentModuleIndex] = useState(0)
  const [userAnswers, setUserAnswers] = useState({})

  const handleSetupComplete = () => {
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

  if (currentView === 'setup') {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <SetupPage 
          instructions={testData.setup.instructions}
          onComplete={handleSetupComplete}
        />
      </ThemeProvider>
    )
  }

  if (currentView === 'module' && testData.modules[currentModuleIndex]) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <ModuleView
          module={testData.modules[currentModuleIndex]}
          userAnswers={userAnswers}
          onAnswerChange={updateAnswer}
          onComplete={handleModuleComplete}
        />
      </ThemeProvider>
    )
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Test Complete!</h1>
          <p>Thank you for completing the test.</p>
        </div>
      </div>
    </ThemeProvider>
  )
}

export default App

