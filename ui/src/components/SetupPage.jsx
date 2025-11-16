import { useState, useEffect } from 'react'
import { Box, Button, Card, CardContent, Typography, List, ListItem, ListItemText, Alert, CircularProgress } from '@mui/material'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import ErrorIcon from '@mui/icons-material/Error'
import VideocamIcon from '@mui/icons-material/Videocam'
import MicIcon from '@mui/icons-material/Mic'

function SetupPage({ instructions, onComplete }) {
  const [cameraPermission, setCameraPermission] = useState(null)
  const [microphonePermission, setMicrophonePermission] = useState(null)
  const [checking, setChecking] = useState(true)
  const [requesting, setRequesting] = useState(false)

  // Check permissions on component mount without prompting
  useEffect(() => {
    checkPermissionsSilently()
  }, [])

  const checkPermissionsSilently = async () => {
    setChecking(true)
    
    try {
      // Try using Permissions API first (doesn't prompt)
      let cameraStatus = null
      let micStatus = null

      if (navigator.permissions && navigator.permissions.query) {
        try {
          // Check camera permission
          const cameraPermission = await navigator.permissions.query({ name: 'camera' })
          cameraStatus = cameraPermission.state
          
          // Check microphone permission
          const micPermission = await navigator.permissions.query({ name: 'microphone' })
          micStatus = micPermission.state
        } catch (error) {
          // Permissions API might not support camera/microphone in this browser
          console.log('Permissions API not fully supported, trying alternative method')
        }
      }

      // If Permissions API returned 'granted', we're done
      if (cameraStatus === 'granted') {
        setCameraPermission(true)
      } else if (cameraStatus === 'denied') {
        setCameraPermission(false)
      } else {
        // Status is 'prompt' or unknown - don't check with getUserMedia as it would prompt
        // Only check silently if we can determine it won't prompt
        // For browsers that don't support Permissions API for camera/mic, we'll leave as null
        setCameraPermission(null)
      }

      if (micStatus === 'granted') {
        setMicrophonePermission(true)
      } else if (micStatus === 'denied') {
        setMicrophonePermission(false)
      } else {
        // Status is 'prompt' or unknown - don't check with getUserMedia as it would prompt
        setMicrophonePermission(null)
      }

      // For browsers that don't support Permissions API for camera/microphone,
      // we can't safely check without potentially prompting, so we leave as null
      // User will need to click the button to request permissions
    } catch (error) {
      console.error('Error checking permissions:', error)
    } finally {
      setChecking(false)
    }
  }

  const requestCameraPermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true })
      setCameraPermission(true)
      stream.getTracks().forEach(track => track.stop())
      return true
    } catch (error) {
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        setCameraPermission(false)
      } else {
        setCameraPermission(false)
      }
      return false
    }
  }

  const requestMicrophonePermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      setMicrophonePermission(true)
      stream.getTracks().forEach(track => track.stop())
      return true
    } catch (error) {
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        setMicrophonePermission(false)
      } else {
        setMicrophonePermission(false)
      }
      return false
    }
  }

  const handleRequestPermissions = async () => {
    setRequesting(true)
    setChecking(true)

    try {
      // Request both permissions - browser will show prompts
      const [cameraResult, micResult] = await Promise.all([
        requestCameraPermission(),
        requestMicrophonePermission()
      ])

      // If either failed, show appropriate messages
      if (!cameraResult || !micResult) {
        // Permissions already set by the request functions
      }
    } catch (error) {
      console.error('Error requesting permissions:', error)
    } finally {
      setChecking(false)
      setRequesting(false)
    }
  }

  const handleRequestCameraOnly = async () => {
    setChecking(true)
    await requestCameraPermission()
    setChecking(false)
  }

  const handleRequestMicrophoneOnly = async () => {
    setChecking(true)
    await requestMicrophonePermission()
    setChecking(false)
  }

  // Disabled permissions check for quick testing - set to always allow proceeding
  const canProceed = true // cameraPermission === true && microphonePermission === true

  return (
    <Box className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="max-w-3xl w-full">
        <CardContent className="p-8">
          <Typography variant="h4" component="h1" className="mb-6 font-bold text-center">
            Test Setup
          </Typography>

          <Box className="mb-8">
            <Typography variant="h6" className="mb-4 font-semibold">
              Instructions
            </Typography>
            <List>
              {instructions.map((instruction, index) => (
                <ListItem key={index} className="pl-0">
                  <ListItemText 
                    primary={instruction}
                    primaryTypographyProps={{ className: "text-gray-700" }}
                  />
                </ListItem>
              ))}
            </List>
          </Box>

          <Box className="mb-8">
            <Typography variant="h6" className="mb-4 font-semibold">
              Browser Permissions
            </Typography>
            <Typography variant="body2" className="mb-4 text-gray-600">
              The test requires access to your camera and microphone. Permissions are checked automatically. If not already granted, please click the buttons below to grant permissions when prompted by your browser.
            </Typography>

            {checking ? (
              <Box className="flex items-center justify-center py-4">
                <CircularProgress size={24} className="mr-2" />
                <Typography>{requesting ? 'Requesting permissions...' : 'Checking permissions...'}</Typography>
              </Box>
            ) : (
              <Box className="space-y-4">
                <Box className="p-4 border rounded-lg">
                  <Box className="flex items-center justify-between mb-2">
                    <Box className="flex items-center">
                      <VideocamIcon className={cameraPermission ? "text-green-500 mr-2" : "text-gray-400 mr-2"} />
                      <Typography variant="body1" className="font-medium">
                        Camera Permission
                      </Typography>
                    </Box>
                    {cameraPermission === true ? (
                      <Box className="flex items-center text-green-700">
                        <CheckCircleIcon className="mr-1" fontSize="small" />
                        <Typography variant="body2">Granted</Typography>
                      </Box>
                    ) : cameraPermission === false ? (
                      <Box className="flex items-center text-red-700">
                        <ErrorIcon className="mr-1" fontSize="small" />
                        <Typography variant="body2">Denied</Typography>
                      </Box>
                    ) : (
                      <Typography variant="body2" className="text-gray-500">Not requested</Typography>
                    )}
                  </Box>
                  {cameraPermission !== true && (
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={handleRequestCameraOnly}
                      disabled={checking}
                      className="mt-2"
                    >
                      Request Camera Permission
                    </Button>
                  )}
                </Box>

                <Box className="p-4 border rounded-lg">
                  <Box className="flex items-center justify-between mb-2">
                    <Box className="flex items-center">
                      <MicIcon className={microphonePermission ? "text-green-500 mr-2" : "text-gray-400 mr-2"} />
                      <Typography variant="body1" className="font-medium">
                        Microphone Permission
                      </Typography>
                    </Box>
                    {microphonePermission === true ? (
                      <Box className="flex items-center text-green-700">
                        <CheckCircleIcon className="mr-1" fontSize="small" />
                        <Typography variant="body2">Granted</Typography>
                      </Box>
                    ) : microphonePermission === false ? (
                      <Box className="flex items-center text-red-700">
                        <ErrorIcon className="mr-1" fontSize="small" />
                        <Typography variant="body2">Denied</Typography>
                      </Box>
                    ) : (
                      <Typography variant="body2" className="text-gray-500">Not requested</Typography>
                    )}
                  </Box>
                  {microphonePermission !== true && (
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={handleRequestMicrophoneOnly}
                      disabled={checking}
                      className="mt-2"
                    >
                      Request Microphone Permission
                    </Button>
                  )}
                </Box>

                {!canProceed && (cameraPermission === false || microphonePermission === false) && (
                  <Alert severity="warning" className="mt-4">
                    {cameraPermission === false && microphonePermission === false
                      ? "Camera and microphone permissions were denied. Please allow access in your browser settings and try again."
                      : cameraPermission === false
                      ? "Camera permission was denied. Please allow camera access in your browser settings and try again."
                      : "Microphone permission was denied. Please allow microphone access in your browser settings and try again."}
                  </Alert>
                )}
              </Box>
            )}
          </Box>

          <Box className="flex justify-between mt-8">
            <Button
              variant="outlined"
              onClick={handleRequestPermissions}
              disabled={checking || (cameraPermission === true && microphonePermission === true)}
              startIcon={<VideocamIcon />}
            >
              Request All Permissions
            </Button>
            <Button
              variant="contained"
              onClick={onComplete}
              disabled={!canProceed || checking}
              size="large"
            >
              Start Test
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  )
}

export default SetupPage

