/**
 * Utility function to resolve asset reference IDs to actual URLs
 * Works for both audio and image references
 * @param {string|object} assetReference - The asset reference ID string or object
 * @param {Array} assetReferencesResolved - Array of resolved asset references
 * @returns {string|null} - The resolved URL or null if not found
 */
export const resolveAssetReference = (assetReference, assetReferencesResolved = []) => {
  if (!assetReference) {
    return null
  }

  // If assetReference is an object with type and bucket/key (old format), return null
  // We only handle string IDs now
  if (typeof assetReference !== 'string') {
    return null
  }

  // Find the matching entry in assetReferencesResolved
  const resolvedAsset = assetReferencesResolved.find(
    (asset) => asset.id === assetReference
  )

  if (!resolvedAsset) {
    console.warn(`Asset reference not found: ${assetReference}`)
    return null
  }

  // For type "url", return the reference field
  if (resolvedAsset.type === 'url' && resolvedAsset.reference) {
    return resolvedAsset.reference
  }

  // For other types, return null (not yet implemented)
  console.warn(`Unsupported asset type: ${resolvedAsset.type} for ${assetReference}`)
  return null
}

/**
 * Utility function to resolve audioReference IDs to actual URLs
 * @param {string|object} audioReference - The audioReference ID string or object
 * @param {Array} assetReferencesResolved - Array of resolved asset references
 * @returns {string|null} - The resolved URL or null if not found
 * @deprecated Use resolveAssetReference instead
 */
export const resolveAudioReference = (audioReference, assetReferencesResolved = []) => {
  return resolveAssetReference(audioReference, assetReferencesResolved)
}
