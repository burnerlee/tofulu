import { createContext, useContext, useState, useEffect } from 'react'

const VolumeContext = createContext()

export const useVolume = () => {
  const context = useContext(VolumeContext)
  if (!context) {
    throw new Error('useVolume must be used within a VolumeProvider')
  }
  return context
}

export const VolumeProvider = ({ children }) => {
  // Load volume from localStorage or default to 75
  const [volume, setVolume] = useState(() => {
    const savedVolume = localStorage.getItem('testVolume')
    return savedVolume ? parseInt(savedVolume, 10) : 75
  })

  // Save volume to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('testVolume', volume.toString())
  }, [volume])

  // Get volume as a decimal (0-1) for HTML5 Audio API
  const getVolumeDecimal = () => {
    return volume / 100
  }

  const updateVolume = (newVolume) => {
    setVolume(newVolume)
  }

  // Apply volume to an audio element
  const applyVolumeToAudio = (audioElement) => {
    if (audioElement && audioElement.volume !== undefined) {
      audioElement.volume = getVolumeDecimal()
    }
  }

  const value = {
    volume,
    setVolume: updateVolume,
    getVolumeDecimal,
    applyVolumeToAudio,
  }

  return (
    <VolumeContext.Provider value={value}>
      {children}
    </VolumeContext.Provider>
  )
}

