import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import '../../../styles/narration/geminiNarrationResults.css';
import { VariableSizeList as List } from 'react-window';

// Import utility functions
import { getAudioUrl } from '../../../services/narrationService';

// Constants for localStorage keys
const NARRATION_CACHE_KEY = 'gemini_narration_cache';
const CURRENT_VIDEO_ID_KEY = 'current_youtube_url';
const CURRENT_FILE_ID_KEY = 'current_file_cache_id';

/**
 * Component for displaying Gemini narration results with audio playback
 * @param {Object} props - Component props
 * @param {Array} props.generationResults - Array of narration results
 * @param {Function} props.onRetry - Function to retry generation for a specific subtitle
 * @param {number|null} props.retryingSubtitleId - ID of the subtitle currently being retried
 * @param {Function} props.onRetryFailed - Function to retry all failed narrations
 * @param {boolean} props.hasGenerationError - Whether there was an error during generation
 * @param {string} props.subtitleSource - Selected subtitle source ('original' or 'translated')
 * @returns {JSX.Element} - Rendered component
 */
// Virtualized row renderer for Gemini narration results
const GeminiResultRow = ({ index, style, data }) => {
  const {
    generationResults,
    onRetry,
    retryingSubtitleId,
    currentlyPlaying,
    isPlaying,
    playAudio,
    downloadAudio,
    t
  } = data;

  const item = generationResults[index];
  const subtitle_id = item.subtitle_id;
  const text = item.text;

  return (
    <div
      style={style}
      className={`gemini-result-item
        ${item.success ? 'success' : 'failed'}
        ${item.pending ? 'pending' : ''}
        ${currentlyPlaying === subtitle_id ? 'playing' : ''}
        ${retryingSubtitleId === subtitle_id ? 'retrying' : ''}`}
    >
      <div className="gemini-result-text">
        <span className="gemini-result-id">{subtitle_id}.</span>
        {text}
      </div>

      <div className="audio-controls">
        {item.success && (item.audioData || item.filename) ? (
          // Successful generation with audio data or filename
          <>
            <button
              className="pill-button primary"
              onClick={() => playAudio(item)}
            >
              {currentlyPlaying === subtitle_id && isPlaying ? (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="6" y="4" width="4" height="16" fill="currentColor" />
                    <rect x="14" y="4" width="4" height="16" fill="currentColor" />
                  </svg>
                  {t('narration.pause', 'Pause')}
                </>
              ) : (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="5 3 19 12 5 21 5 3" fill="currentColor" />
                  </svg>
                  {t('narration.play', 'Play')}
                </>
              )}
            </button>
            <button
              className="pill-button secondary"
              onClick={() => downloadAudio(item)}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              {t('narration.download', 'Download')}
            </button>
            <button
              className={`pill-button secondary retry-button ${retryingSubtitleId === subtitle_id ? 'retrying' : ''}`}
              onClick={() => onRetry(subtitle_id)}
              title={!data.subtitleSource
                ? t('narration.noSourceSelectedError', 'Please select a subtitle source (Original or Translated)')
                : t('narration.retry', 'Retry generation')}
              disabled={retryingSubtitleId === subtitle_id || !data.subtitleSource}
            >
              {retryingSubtitleId === subtitle_id ? (
                <>
                  <svg className="spinner" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 6v6l4 2" />
                  </svg>
                  {t('narration.retrying', 'Retrying...')}
                </>
              ) : (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 4v6h6" />
                    <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
                  </svg>
                  {t('narration.retry', 'Retry')}
                </>
              )}
            </button>
          </>
        ) : item.pending ? (
          // Pending generation - show generate button
          <>
            <span className="gemini-status-message pending">
              {t('narration.pending', 'Pending generation...')}
            </span>
            <button
              className={`pill-button secondary generate-button ${retryingSubtitleId === subtitle_id ? 'retrying' : ''}`}
              onClick={() => onRetry(subtitle_id)}
              title={!data.subtitleSource
                ? t('narration.noSourceSelectedError', 'Please select a subtitle source (Original or Translated)')
                : t('narration.generate', 'Generate this narration')}
              disabled={retryingSubtitleId === subtitle_id || !data.subtitleSource}
            >
              {retryingSubtitleId === subtitle_id ? (
                <>
                  <svg className="spinner" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 6v6l4 2" />
                  </svg>
                  {t('narration.generating', 'Generating...')}
                </>
              ) : (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="5 3 19 12 5 21 5 3" fill="currentColor" />
                  </svg>
                  {t('narration.generate', 'Generate')}
                </>
              )}
            </button>
          </>
        ) : (
          // Failed generation
          <>
            <span className="gemini-error-message">
              {t('narration.failed', 'Generation failed')}
              {/* Add a debug message to help diagnose the issue */}
              {item.error && <div className="error-details">{item.error}</div>}
            </span>
            <button
              className={`pill-button secondary retry-button ${retryingSubtitleId === subtitle_id ? 'retrying' : ''}`}
              onClick={() => onRetry(subtitle_id)}
              title={!data.subtitleSource
                ? t('narration.noSourceSelectedError', 'Please select a subtitle source (Original or Translated)')
                : t('narration.retry', 'Retry generation')}
              disabled={retryingSubtitleId === subtitle_id || !data.subtitleSource}
            >
              {retryingSubtitleId === subtitle_id ? (
                <>
                  <svg className="spinner" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 6v6l4 2" />
                  </svg>
                  {t('narration.retrying', 'Retrying...')}
                </>
              ) : (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 4v6h6" />
                    <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
                  </svg>
                  {t('narration.retry', 'Retry')}
                </>
              )}
            </button>
          </>
        )}
      </div>
    </div>
  );
};

/**
 * Helper function to generate a hash for subtitles to use as a cache key
 * @param {Array} subtitles - Array of subtitle objects
 * @returns {string} - Hash string
 */
const generateSubtitleHash = (subtitles) => {
  if (!subtitles || !subtitles.length) return '';

  // Create a string representation of the subtitles (just IDs and text)
  const subtitleString = subtitles.map(s => `${s.subtitle_id}:${s.text}`).join('|');

  // Simple hash function
  let hash = 0;
  for (let i = 0; i < subtitleString.length; i++) {
    const char = subtitleString.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }

  return hash.toString(16);
};

/**
 * Helper function to get the current video/file identifier
 * @returns {string|null} - Current video/file ID or null if not found
 */
const getCurrentMediaId = () => {
  // Check for YouTube URL first
  const youtubeUrl = localStorage.getItem(CURRENT_VIDEO_ID_KEY);
  if (youtubeUrl) {
    // Extract video ID from URL
    const match = youtubeUrl.match(/(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/);
    return match ? match[1] : null;
  }

  // Check for file cache ID
  return localStorage.getItem(CURRENT_FILE_ID_KEY);
};

const GeminiNarrationResults = ({
  generationResults,
  onRetry,
  retryingSubtitleId,
  onRetryFailed,
  hasGenerationError = false,
  subtitleSource
}) => {
  const { t } = useTranslation();
  const [currentlyPlaying, setCurrentlyPlaying] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef(null);
  const listRef = useRef(null);
  const rowHeights = useRef({});
  const [loadedFromCache, setLoadedFromCache] = useState(false);

  // Check if there are any failed narrations
  const hasFailedNarrations = generationResults && generationResults.some(result => !result.success);

  // Function to calculate row height based on text content
  const getRowHeight = index => {
    // If we already calculated this height, return it
    if (rowHeights.current[index] !== undefined) {
      return rowHeights.current[index];
    }

    const item = generationResults[index];
    if (!item) return 60; // Default height

    // Calculate height based on text length
    const text = item.text || '';
    const lineCount = text.split('\n').length; // Count actual line breaks
    const estimatedLines = Math.ceil(text.length / 40); // Estimate based on characters per line
    const lines = Math.max(lineCount, estimatedLines);

    // Base height + additional height per line + space for controls
    const height = 60 + (lines > 1 ? (lines - 1) * 20 : 0);

    // Cache the calculated height
    rowHeights.current[index] = height;
    return height;
  };

  // Reset row heights when results change
  useEffect(() => {
    rowHeights.current = {};
    if (listRef.current) {
      listRef.current.resetAfterIndex(0);
    }

    // Save narrations to cache when they change
    if (generationResults && generationResults.length > 0) {
      try {
        // Get current media ID
        const mediaId = getCurrentMediaId();
        if (!mediaId) return;

        // Generate a hash of the subtitles
        const subtitleHash = generateSubtitleHash(generationResults);

        // Create cache entry with only essential data
        const essentialNarrations = generationResults.map(result => ({
          subtitle_id: result.subtitle_id,
          filename: result.filename,
          success: result.success,
          text: result.text
        }));

        const cacheEntry = {
          mediaId,
          subtitleHash,
          timestamp: Date.now(),
          narrations: essentialNarrations
        };

        // Save to localStorage
        localStorage.setItem(NARRATION_CACHE_KEY, JSON.stringify(cacheEntry));

      } catch (error) {
        console.error('Error saving narrations to cache:', error);
      }
    }
  }, [generationResults]);

  // Load narrations from cache on component mount
  useEffect(() => {
    // Only try to load from cache if we don't have results yet
    if (generationResults && generationResults.length > 0) return;

    try {
      // Get current media ID
      const mediaId = getCurrentMediaId();
      if (!mediaId) return;

      // Get cache entry
      const cacheEntryJson = localStorage.getItem(NARRATION_CACHE_KEY);
      if (!cacheEntryJson) return;

      const cacheEntry = JSON.parse(cacheEntryJson);

      // Check if cache entry is for the current media
      if (cacheEntry.mediaId !== mediaId) return;

      // Check if we have narrations
      if (!cacheEntry.narrations || !cacheEntry.narrations.length) return;



      // Set loading state first
      setLoadedFromCache(true);

      // Use a small timeout to ensure the loading state is rendered
      setTimeout(() => {
        // Dispatch an event to notify other components about the loaded narrations
        const event = new CustomEvent('narrations-loaded-from-cache', {
          detail: {
            narrations: cacheEntry.narrations,
            timestamp: Date.now()
          }
        });
        window.dispatchEvent(event);
      }, 100);
    } catch (error) {
      console.error('Error loading narrations from cache:', error);
    }
  }, [generationResults]);

  // Listen for narrations-updated event to update the component
  useEffect(() => {
    const handleNarrationsUpdated = (event) => {
      if (event.detail && event.detail.narrations && event.detail.fromCache) {

        // Reset loading state since we now have the narrations
        setLoadedFromCache(false);
      }
    };

    // Add event listener
    window.addEventListener('narrations-updated', handleNarrationsUpdated);

    // Clean up
    return () => {
      window.removeEventListener('narrations-updated', handleNarrationsUpdated);
    };
  }, []);

  // Show a loading message while waiting for narrations to load
  useEffect(() => {
    // If we have loaded from cache but don't have results yet, show a loading message
    if (loadedFromCache && (!generationResults || generationResults.length === 0)) {

    }
  }, [loadedFromCache, generationResults]);

  // Initialize audio element on component mount
  // Super simple audio playback function - no initialization needed
  const playAudio = (result) => {
    // If already playing this audio, stop it
    if (currentlyPlaying === result.subtitle_id && isPlaying) {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      setIsPlaying(false);
      setCurrentlyPlaying(null);
      return;
    }

    // Stop any currently playing audio
    if (audioRef.current) {
      audioRef.current.pause();
    }

    // Get the audio URL
    const audioUrl = getAudioUrl(result.filename);
    console.log(`[DEBUG] Playing audio with filename: ${result.filename}`);
    console.log(`[DEBUG] Audio URL: ${audioUrl}`);

    // Add a cache-busting parameter to the URL
    const cacheBustUrl = `${audioUrl}?t=${Date.now()}`;
    console.log(`[DEBUG] Cache-busting URL: ${cacheBustUrl}`);

    // Try to fetch the audio file first to check if it exists
    fetch(cacheBustUrl)
      .then(response => {
        console.log(`[DEBUG] Fetch response status: ${response.status}`);
        if (!response.ok) {
          console.error(`[DEBUG] Fetch failed: ${response.status} ${response.statusText}`);
          throw new Error(`Failed to fetch audio file: ${response.status} ${response.statusText}`);
        }
        return response.blob();
      })
      .then(blob => {
        // Create a blob URL for the audio
        const blobUrl = URL.createObjectURL(blob);
        console.log(`[DEBUG] Created blob URL: ${blobUrl}`);

        // Create a new audio element with the blob URL
        const audio = new Audio(blobUrl);

        // Add error handling
        audio.onerror = (e) => {
          console.error(`[DEBUG] Audio error for subtitle ${result.subtitle_id}:`, e);
          console.error(`[DEBUG] Audio error code:`, audio.error?.code);
          console.error(`[DEBUG] Audio error message:`, audio.error?.message);
          console.error(`[DEBUG] Audio src:`, audio.src);
        };

        // Set up only what we need - play and handle ending
        audio.onended = () => {
          setIsPlaying(false);
          setCurrentlyPlaying(null);
          // Clean up the blob URL
          URL.revokeObjectURL(blobUrl);
        };

        // Update state and play
        setCurrentlyPlaying(result.subtitle_id);
        setIsPlaying(true);

        // Play it
        audio.play().catch(error => {
          console.error(`[DEBUG] Error playing audio:`, error);
          setIsPlaying(false);
          setCurrentlyPlaying(null);
          URL.revokeObjectURL(blobUrl);
        });

        // Store reference
        audioRef.current = audio;
      })
      .catch(error => {
        console.error(`[DEBUG] Error fetching or playing audio:`, error);
        setIsPlaying(false);
        setCurrentlyPlaying(null);

        // Try to use the legacy filename format as a fallback
        if (result.filename.includes('/')) {
          const legacyFilename = `gemini_${result.subtitle_id}_${Date.now()}.wav`;
          const legacyUrl = getAudioUrl(legacyFilename);
          console.log(`[DEBUG] Trying legacy URL as fallback: ${legacyUrl}`);

          // Add a cache-busting parameter to the legacy URL
          const cacheBustLegacyUrl = `${legacyUrl}?t=${Date.now()}`;
          console.log(`[DEBUG] Cache-busting legacy URL: ${cacheBustLegacyUrl}`);

          // Create a new audio element with the legacy URL
          const audio = new Audio(cacheBustLegacyUrl);

          // Add error handling
          audio.onerror = (e) => {
            console.error(`[DEBUG] Legacy audio error for subtitle ${result.subtitle_id}:`, e);
          };

          // Set up only what we need - play and handle ending
          audio.onended = () => {
            setIsPlaying(false);
            setCurrentlyPlaying(null);
          };

          // Update state and play
          setCurrentlyPlaying(result.subtitle_id);
          setIsPlaying(true);

          // Play it
          audio.play().catch(legacyError => {
            console.error(`[DEBUG] Error playing legacy audio:`, legacyError);
            setIsPlaying(false);
            setCurrentlyPlaying(null);
          });

          // Store reference
          audioRef.current = audio;
        }
      });
  };

  // Download audio as WAV file
  const downloadAudio = (result) => {
    if (result.filename) {
      try {
        console.log(`[DEBUG] Downloading audio with filename: ${result.filename}`);

        // Get the audio URL
        const audioUrl = getAudioUrl(result.filename);
        console.log(`[DEBUG] Download URL: ${audioUrl}`);

        // Add a cache-busting parameter to the URL
        const cacheBustUrl = `${audioUrl}?t=${Date.now()}`;
        console.log(`[DEBUG] Cache-busting download URL: ${cacheBustUrl}`);

        // Use fetch to get the file as a blob
        fetch(cacheBustUrl)
          .then(response => {
            console.log(`[DEBUG] Download fetch response status: ${response.status}`);
            if (!response.ok) {
              console.error(`[DEBUG] Download fetch failed: ${response.status} ${response.statusText}`);
              throw new Error(`Server responded with ${response.status}: ${response.statusText}`);
            }
            return response.blob();
          })
          .then(blob => {
            console.log(`[DEBUG] Got blob for download, size: ${blob.size} bytes, type: ${blob.type}`);

            // Create a blob URL
            const blobUrl = URL.createObjectURL(blob);

            // Create a download link
            const a = document.createElement('a');
            a.href = blobUrl;
            a.download = `narration_${result.subtitle_id}.wav`;
            a.style.display = 'none';
            document.body.appendChild(a);

            // Trigger the download
            a.click();

            // Clean up
            setTimeout(() => {
              document.body.removeChild(a);
              URL.revokeObjectURL(blobUrl);
            }, 100);
          })
          .catch(error => {
            console.error('[DEBUG] Error downloading audio file:', error);

            // Try to use the legacy filename format as a fallback
            if (result.filename.includes('/')) {
              console.log('[DEBUG] Trying legacy filename format as fallback');
              const legacyFilename = `gemini_${result.subtitle_id}_${Date.now()}.wav`;
              const legacyUrl = getAudioUrl(legacyFilename);

              console.log(`[DEBUG] Trying legacy URL for download: ${legacyUrl}`);

              // Add a cache-busting parameter to the legacy URL
              const cacheBustLegacyUrl = `${legacyUrl}?t=${Date.now()}`;
              console.log(`[DEBUG] Cache-busting legacy URL: ${cacheBustLegacyUrl}`);

              // Try the legacy URL
              fetch(cacheBustLegacyUrl)
                .then(response => {
                  if (!response.ok) {
                    throw new Error(`Server responded with ${response.status}: ${response.statusText}`);
                  }
                  return response.blob();
                })
                .then(blob => {
                  // Create a blob URL
                  const blobUrl = URL.createObjectURL(blob);

                  // Create a download link
                  const a = document.createElement('a');
                  a.href = blobUrl;
                  a.download = `narration_${result.subtitle_id}.wav`;
                  a.style.display = 'none';
                  document.body.appendChild(a);

                  // Trigger the download
                  a.click();

                  // Clean up
                  setTimeout(() => {
                    document.body.removeChild(a);
                    URL.revokeObjectURL(blobUrl);
                  }, 100);
                })
                .catch(legacyError => {
                  console.error('[DEBUG] Error downloading with legacy format:', legacyError);
                  alert(t('narration.downloadError', `Error downloading audio file: ${error.message}`));
                });
            } else {
              alert(t('narration.downloadError', `Error downloading audio file: ${error.message}`));
            }
          });
      } catch (error) {
        console.error('[DEBUG] Error initiating download:', error);
        alert(t('narration.downloadError', `Error initiating download: ${error.message}`));
      }
    } else {
      console.error('[DEBUG] No filename available for download');
      alert(t('narration.downloadError', 'No audio file available for download'));
    }
  };



  return (
    <div className="gemini-narration-results">
      <div className="results-header">
        <h4>{t('narration.geminiResults', 'Generated Narration (Gemini)')}</h4>

        {/* Retry Failed Narrations button */}
        {hasFailedNarrations && onRetryFailed && (
          <button
            className="pill-button secondary retry-failed-button"
            onClick={onRetryFailed}
            disabled={retryingSubtitleId !== null || !subtitleSource}
            title={!subtitleSource
              ? t('narration.noSourceSelectedError', 'Please select a subtitle source (Original or Translated)')
              : t('narration.retryFailedTooltip', 'Retry all failed narrations')}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M1 4v6h6" />
              <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
            </svg>
            {t('narration.retryFailed', 'Retry Failed Narrations')}
          </button>
        )}
      </div>

      <div className="gemini-results-list">
        {(!generationResults || generationResults.length === 0) && !hasGenerationError ? (
          loadedFromCache ? (
            // Show loading indicator when loading from cache
            <div className="loading-from-cache-message">
              <div className="loading-spinner-small"></div>
              {t('narration.loadingFromCache', 'Loading narrations from previous session...')}
            </div>
          ) : (
            // Show waiting message when no results and not loading from cache
            <div className="no-results-message">
              {t('narration.waitingForResults', 'Waiting for narration results...')}
            </div>
          )
        ) : (
          // Use virtualized list for better performance with large datasets
          <List
            ref={listRef}
            className="gemini-results-virtualized-list"
            height={350} // Reduced height for the Gemini virtualized container to avoid empty space
            width="100%"
            itemCount={generationResults ? generationResults.length : 0}
            itemSize={getRowHeight} // Dynamic row heights based on content
            overscanCount={5} // Number of items to render outside of the visible area
            itemData={{
              generationResults: generationResults || [],
              onRetry,
              retryingSubtitleId,
              currentlyPlaying,
              isPlaying,
              playAudio,
              downloadAudio,
              subtitleSource,
              t
            }}
          >
            {GeminiResultRow}
          </List>
        )}
      </div>



      {/* We're using a programmatically created audio element instead of this one */}
      {/* This is just a placeholder for the ref */}
    </div>
  );
};

export default GeminiNarrationResults;
