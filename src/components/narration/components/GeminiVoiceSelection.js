import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { GEMINI_VOICES } from '../../../services/gemini/geminiNarrationService';
import '../../../styles/narration/geminiVoiceSelectionCompact.css';

/**
 * Component for selecting a Gemini voice
 * @param {Object} props - Component props
 * @param {string} props.selectedVoice - Currently selected voice
 * @param {Function} props.setSelectedVoice - Function to set selected voice
 * @param {boolean} props.isGenerating - Whether generation is in progress
 * @returns {JSX.Element} - Rendered component
 */
const GeminiVoiceSelection = ({
  selectedVoice,
  setSelectedVoice,
  isGenerating
}) => {
  const { t } = useTranslation();
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentPlayingVoice, setCurrentPlayingVoice] = useState(null);

  // Group voices by gender
  const femaleVoices = GEMINI_VOICES.filter(voice => voice.gender === 'Female');
  const maleVoices = GEMINI_VOICES.filter(voice => voice.gender === 'Male');

  const handleVoiceChange = (e) => {
    const newVoice = e.target.value;

    setSelectedVoice(newVoice);

    // Store in localStorage for persistence
    try {
      localStorage.setItem('gemini_voice', newVoice);
    } catch (e) {
      console.error('Error storing voice in localStorage:', e);
    }
  };

  const playVoiceSample = (voiceId) => {
    // If already playing this voice, stop it
    if (isPlaying && currentPlayingVoice === voiceId) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
      setCurrentPlayingVoice(null);
      return;
    }

    // Play the voice sample
    const audioPath = `/audio/voices/chirp3-hd-${voiceId.toLowerCase()}.wav`;

    if (audioRef.current) {
      audioRef.current.src = audioPath;
      audioRef.current.play()
        .then(() => {
          setIsPlaying(true);
          setCurrentPlayingVoice(voiceId);
        })
        .catch(error => {
          console.error('Error playing audio:', error);
          setIsPlaying(false);
          setCurrentPlayingVoice(null);
        });
    }
  };

  // Handle audio ended event
  useEffect(() => {
    const handleAudioEnded = () => {
      setIsPlaying(false);
      setCurrentPlayingVoice(null);
    };

    if (audioRef.current) {
      const audio = audioRef.current; // Store reference to avoid closure issues
      audio.addEventListener('ended', handleAudioEnded);

      return () => {
        audio.removeEventListener('ended', handleAudioEnded);
      };
    }
  }, []);

  // Get the currently selected voice object
  const selectedVoiceObj = GEMINI_VOICES.find(voice => voice.id === selectedVoice) || GEMINI_VOICES[0];

  // Get the gender of the currently selected voice
  const selectedGender = selectedVoiceObj?.gender || 'Female';

  // Filter voices by the selected gender
  const filteredVoices = GEMINI_VOICES.filter(voice => voice.gender === selectedGender);

  return (
    <div className="narration-row gemini-voice-row animated-row">
      <div className="row-label">
        <label>{t('narration.voice', 'Voice')}:</label>
      </div>
      <div className="row-content">
        <div className="gemini-voice-selection">
          {/* Hidden audio element for playing voice samples */}
          <audio ref={audioRef} className="voice-sample-audio" />

          <div className="voice-dropdown-container">
            {/* Voice type selection pills */}
            <div className="voice-type-pills">
              <div className={`voice-type-pill female`}>
                <input
                  type="radio"
                  id="voice-type-female"
                  name="voice-type"
                  value="Female"
                  checked={selectedGender === 'Female'}
                  onChange={() => {
                    // Find the first female voice and select it
                    const firstFemaleVoice = femaleVoices[0];
                    if (firstFemaleVoice) {
                      setSelectedVoice(firstFemaleVoice.id);
                      localStorage.setItem('gemini_voice', firstFemaleVoice.id);
                    }
                  }}
                  disabled={isGenerating}
                />
                <label htmlFor="voice-type-female">
                  {t('narration.femaleVoices', 'Female Voices')}
                </label>
              </div>

              <div className={`voice-type-pill male`}>
                <input
                  type="radio"
                  id="voice-type-male"
                  name="voice-type"
                  value="Male"
                  checked={selectedGender === 'Male'}
                  onChange={() => {
                    // Find the first male voice and select it
                    const firstMaleVoice = maleVoices[0];
                    if (firstMaleVoice) {
                      setSelectedVoice(firstMaleVoice.id);
                      localStorage.setItem('gemini_voice', firstMaleVoice.id);
                    }
                  }}
                  disabled={isGenerating}
                />
                <label htmlFor="voice-type-male">
                  {t('narration.maleVoices', 'Male Voices')}
                </label>
              </div>
            </div>

            {/* Voice dropdown */}
            <div className="voice-dropdown">
              <select
                value={selectedVoice}
                onChange={handleVoiceChange}
                disabled={isGenerating}
              >
                {filteredVoices.map(voice => (
                  <option key={voice.id} value={voice.id}>
                    {voice.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Play button */}
            <button
              type="button"
              className={`play-voice-sample ${isPlaying && currentPlayingVoice === selectedVoice ? 'playing' : ''}`}
              onClick={(e) => {
                e.preventDefault();
                playVoiceSample(selectedVoice);
              }}
              title={t('narration.playVoiceSample', 'Play voice sample')}
              disabled={isGenerating}
            >
              {isPlaying && currentPlayingVoice === selectedVoice ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="6" y="4" width="4" height="16"></rect>
                  <rect x="14" y="4" width="4" height="16"></rect>
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="5 3 19 12 5 21 5 3"></polygon>
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GeminiVoiceSelection;
