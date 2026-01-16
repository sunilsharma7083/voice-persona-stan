import { useState, useEffect, useRef } from "react";
import { Mic, MicOff, RefreshCw, Play } from "lucide-react";
import { AudioVisualizer } from "@/components/audio-visualizer";
import { AnalysisPanel, AnalysisData } from "@/components/analysis-panel";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MOCK_CONVERSATION } from "@/lib/mock-data";
import generatedImage from '@assets/generated_images/futuristic_ai_data_background.png';

// Declare SpeechRecognition types
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: (event: SpeechRecognitionEvent) => void;
  onerror: (event: any) => void;
  onend: () => void;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

export default function Home() {
  const [isActive, setIsActive] = useState(false);
  const [transcript, setTranscript] = useState<string[]>([]); // Live transcript
  const [analysis, setAnalysis] = useState<AnalysisData | null>(null);
  const [useDemo, setUseDemo] = useState(false);
  const [simIndex, setSimIndex] = useState(0);
  const [detectedLanguageFromSpeech, setDetectedLanguageFromSpeech] = useState<string>("English");
  const [currentRecognitionLang, setCurrentRecognitionLang] = useState<string>("en-IN");
  
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const pitchHistoryRef = useRef<number[]>([]);
  const analysisIntervalRef = useRef<number | null>(null);
  const languageSwitchTimeoutRef = useRef<number | null>(null);
  const lastDetectedLangRef = useRef<string>("en-IN");

  // Detect language from actual text (more accurate than audio analysis)
  const detectLanguageFromText = (text: string): string => {
    if (!text || text.trim().length === 0) return "Unknown";
    
    const lowerText = text.toLowerCase().trim();
    const words = lowerText.split(/\s+/).filter(w => w.length > 0);
    
    // Check for Devanagari script (Hindi/Sanskrit)
    const hasDevanagari = /[\u0900-\u097F]/.test(text);
    if (hasDevanagari) return "Hindi";
    
    // Check for Gurmukhi script (Punjabi)
    const hasGurmukhi = /[\u0A00-\u0A7F]/.test(text);
    if (hasGurmukhi) return "Punjabi";
    
    // Hindi/Hindustani words detection (comprehensive list)
    const hindiWords = [
      'namaste', 'namaskar', 'main', 'mein', 'hoon', 'hun', 'hai', 'he', 'kar', 'karo', 'kare',
      'raha', 'rahi', 'rahe', 'kya', 'kaise', 'kaisa', 'kyun', 'kyu', 'kahan', 'kaha',
      'mera', 'meri', 'mere', 'tera', 'teri', 'tere', 'aap', 'aapka', 'tum', 'tumhara',
      'yeh', 'ye', 'woh', 'wo', 'kuch', 'kuchh', 'sab', 'sabhi', 'accha', 'acha', 'achha',
      'theek', 'thik', 'dhanyavad', 'shukriya', 'bhi', 'nahi', 'nhi', 'nahin', 'haan', 'ha',
      'abhi', 'abi', 'phir', 'fir', 'chaliye', 'chalo', 'chale', 'dekho', 'dekhe', 'dekha',
      'suno', 'suna', 'suniye', 'bahut', 'bahot', 'bohot', 'behtar', 'behtareen', 'badiya',
      'jaise', 'jaisa', 'waisa', 'kaun', 'kon', 'kab', 'kitna', 'kitne', 'kitni',
      'iska', 'uska', 'iske', 'uske', 'isme', 'usme', 'iski', 'uski', 'apna', 'apne', 'apni',
      'koi', 'sabse', 'sath', 'saath', 'bina', 'liye', 'liya', 'diya', 'kiya', 'ho', 'hu',
      'gaya', 'gayi', 'gaye', 'tha', 'thi', 'the', 'hoga', 'hogi', 'honge', 'hun', 'hunga'
    ];
    
    // Punjabi words detection (expanded)
    const punjabiWords = [
      'sat', 'sri', 'akal', 'waheguru', 'paaji', 'paji', 'bhaji', 'veere', 'veer', 
      'kiddan', 'kithe', 'kive', 'kithon', 'tussi', 'tusi', 'sadde', 'sade', 
      'ohda', 'oda', 'ehda', 'eda', 'sanu', 'tenu', 'menu', 'ohnu', 'ehnu', 
      'ohi', 'ehi', 'hanju', 'hegi', 'hovan', 'jithe', 'othe'
    ];
    
    // English words detection (common words)
    const englishWords = [
      'hello', 'hi', 'hey', 'test', 'testing', 'system', 'good', 'great', 'nice', 'excellent',
      'how', 'what', 'where', 'when', 'why', 'who', 'which', 'whose', 'whom',
      'the', 'this', 'that', 'these', 'those', 'a', 'an', 'of', 'in', 'on', 'at', 'to', 'for',
      'yes', 'no', 'okay', 'ok', 'please', 'thank', 'thanks', 'you', 'your', 'welcome',
      'very', 'much', 'more', 'less', 'most', 'some', 'any', 'many', 'few', 'all',
      'project', 'voice', 'persona', 'professional', 'clean', 'perfect', 'working',
      'and', 'or', 'but', 'if', 'then', 'because', 'so', 'as', 'from', 'with',
      'can', 'could', 'should', 'would', 'will', 'shall', 'may', 'might', 'must',
      'is', 'am', 'are', 'was', 'were', 'be', 'been', 'being',
      'have', 'has', 'had', 'do', 'does', 'did', 'make', 'made', 'get', 'got',
      'my', 'me', 'i', 'we', 'us', 'he', 'she', 'it', 'they', 'them', 'his', 'her', 'its', 'their',
      'not', 'don', 'doesn', 'didn', 'won', 'wouldn', 'can\'t', 'cannot', 't'
    ];
    
    // Count matches (exact word matching)
    let hindiCount = 0;
    let punjabiCount = 0;
    let englishCount = 0;
    
    words.forEach(word => {
      const cleanWord = word.replace(/[.,!?;:]$/, ''); // Remove trailing punctuation
      if (hindiWords.includes(cleanWord)) hindiCount++;
      if (punjabiWords.includes(cleanWord)) punjabiCount++;
      if (englishWords.includes(cleanWord)) englishCount++;
    });
    
    const totalWords = words.length;
    const hindiPercent = totalWords > 0 ? (hindiCount / totalWords) * 100 : 0;
    const englishPercent = totalWords > 0 ? (englishCount / totalWords) * 100 : 0;
    const punjabiPercent = totalWords > 0 ? (punjabiCount / totalWords) * 100 : 0;
    
    console.log(`🔍 Lang Analysis - Total: ${totalWords} words | Hindi: ${hindiCount}(${hindiPercent.toFixed(0)}%) | English: ${englishCount}(${englishPercent.toFixed(0)}%) | Punjabi: ${punjabiCount}`);
    
    // Priority-based detection (simplified logic)
    
    // 1. Punjabi detection (any Punjabi word found)
    if (punjabiCount >= 1) return "Punjabi";
    
    // 2. Clear Hindi dominance
    if (hindiCount >= 3) return "Hindi";
    if (hindiPercent >= 50) return "Hindi";
    
    // 3. Clear English dominance
    if (englishCount >= 3 && hindiCount === 0) return "English";
    if (englishPercent >= 60) return "English";
    
    // 4. Hinglish (mixed Hindi + English)
    if (hindiCount >= 1 && englishCount >= 1) {
      if (hindiPercent >= 25 && englishPercent >= 25) return "Hinglish (Hindi+English)";
      if (hindiCount > englishCount) return "Hindi";
      if (englishCount > hindiCount) return "English";
    }
    
    // 5. Small sentences (1-2 words)
    if (totalWords <= 2) {
      if (hindiCount > 0) return "Hindi";
      if (englishCount > 0) return "English";
    }
    
    // 6. Default fallback based on counts
    if (hindiCount > englishCount) return "Hindi";
    if (englishCount > hindiCount) return "English";
    if (englishCount === hindiCount && englishCount > 0) return "Hinglish (Hindi+English)";
    
    // 7. Ultimate fallback - use English if nothing detected
    return "English";
  };

  // Get optimal recognition language code based on detected language
  const getRecognitionLangCode = (detectedLang: string): string => {
    if (detectedLang.includes("Hindi")) {
      return "hi-IN";
    } else if (detectedLang.includes("Punjabi")) {
      return "pa-IN";
    } else if (detectedLang.includes("English")) {
      return "en-IN";
    } else if (detectedLang.includes("Hinglish")) {
      return "hi-IN"; // Use Hindi mode for Hinglish
    }
    return "en-IN"; // Default to English
  };

  // Restart recognition with new language
  const restartRecognitionWithLanguage = (newLang: string) => {
    if (!recognitionRef.current || !isActive) return;
    
    console.log(`🔄 Switching recognition language: ${currentRecognitionLang} → ${newLang}`);
    
    try {
      recognitionRef.current.stop();
      
      setTimeout(() => {
        if (recognitionRef.current && isActive) {
          recognitionRef.current.lang = newLang;
          setCurrentRecognitionLang(newLang);
          lastDetectedLangRef.current = newLang;
          
          try {
            recognitionRef.current.start();
            console.log(`✅ Recognition restarted with ${newLang}`);
          } catch (e) {
            console.log('Recognition restart error:', e);
          }
        }
      }, 300);
    } catch (e) {
      console.log('Recognition stop error:', e);
    }
  };

  // Switch recognition language dynamically
  const switchRecognitionLanguage = (newLang: string) => {
    if (newLang === currentRecognitionLang) return;
    
    restartRecognitionWithLanguage(newLang);
  };

  // Simple but effective real-time voice analysis
  const analyzeVoiceContinuously = () => {
    if (!analyserRef.current || !audioContextRef.current) return;

    const analyser = analyserRef.current;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    const frequencyData = new Float32Array(bufferLength);
    
    analyser.getByteTimeDomainData(dataArray);
    analyser.getFloatFrequencyData(frequencyData);

    // Calculate RMS (volume) to detect if person is speaking
    let sum = 0;
    for (let i = 0; i < bufferLength; i++) {
      const normalized = (dataArray[i] - 128) / 128;
      sum += normalized * normalized;
    }
    const rms = Math.sqrt(sum / bufferLength);
    
    // Only analyze if someone is speaking (above threshold)
    if (rms < 0.01) return; // Silence threshold

    // Detect pitch using autocorrelation
    const sampleRate = audioContextRef.current.sampleRate;
    const pitch = autoCorrelate(dataArray, sampleRate);
    
    // Validate pitch is in reasonable human voice range
    if (pitch > 50 && pitch < 500) {
      pitchHistoryRef.current.push(pitch);
      // Keep only last 50 samples for better stability
      if (pitchHistoryRef.current.length > 50) {
        pitchHistoryRef.current.shift();
      }
    }

    // Need enough samples before making determination (increased for accuracy)
    if (pitchHistoryRef.current.length < 20) return;

    // Remove outliers for better accuracy
    const sortedPitches = [...pitchHistoryRef.current].sort((a, b) => a - b);
    // Remove top and bottom 10% (outliers)
    const trimAmount = Math.floor(sortedPitches.length * 0.1);
    const trimmedPitches = sortedPitches.slice(trimAmount, sortedPitches.length - trimAmount);
    
    // Use median from trimmed data
    const medianPitch = trimmedPitches[Math.floor(trimmedPitches.length / 2)];
    
    // Calculate consistency (how stable the pitch is)
    const pitchStdDev = Math.sqrt(
      trimmedPitches.reduce((sum, p) => sum + Math.pow(p - medianPitch, 2), 0) / trimmedPitches.length
    );
    const isStable = pitchStdDev < 30; // Low deviation = more stable = more confident

    // CORRECTED RANGES FOR INDIAN VOICES
    // Male voices: 85-165 Hz (Indian male average: 110-140 Hz)
    // Female voices: 180-255 Hz (Indian female average: 200-220 Hz)
    // Gap 165-180 is ambiguous
    
    let detectedGender: "Male" | "Female" | "Unknown" = "Unknown";
    let confidence: "low" | "medium" | "high" = "low";

    if (medianPitch < 165) {
      // Male range (extended to 165Hz for Indian males)
      detectedGender = "Male";
      if (medianPitch < 140 && isStable) {
        confidence = "high";
      } else if (medianPitch < 155) {
        confidence = "medium";
      } else {
        confidence = "low"; // 155-165 is borderline
      }
    } else if (medianPitch >= 165 && medianPitch < 180) {
      // Ambiguous range - use energy distribution and voting
      const maleCount = trimmedPitches.filter(p => p < 165).length;
      const femaleCount = trimmedPitches.filter(p => p >= 180).length;
      
      // Calculate energy ratio
      let lowFreqEnergy = 0;
      let highFreqEnergy = 0;
      const splitPoint = Math.floor(frequencyData.length * 0.2);
      for (let i = 0; i < splitPoint; i++) {
        lowFreqEnergy += frequencyData[i];
      }
      for (let i = splitPoint; i < frequencyData.length / 2; i++) {
        highFreqEnergy += frequencyData[i];
      }
      const energyRatio = lowFreqEnergy / (highFreqEnergy + 1);
      
      // More weight to male in borderline (common for young males or high-pitched males)
      if (maleCount > femaleCount || energyRatio > 1.2) {
        detectedGender = "Male";
        confidence = "low";
      } else if (femaleCount > maleCount * 1.5) {
        detectedGender = "Female";
        confidence = "low";
      } else {
        detectedGender = "Male"; // Default to male in truly ambiguous cases
        confidence = "low";
      }
    } else if (medianPitch >= 180 && medianPitch < 200) {
      // Low female range
      detectedGender = "Female";
      confidence = isStable ? "medium" : "low";
    } else if (medianPitch >= 200) {
      // Clear female range
      detectedGender = "Female";
      confidence = medianPitch > 220 && isStable ? "high" : "medium";
    }

    // Secondary validation with energy (only refine, don't override completely)
    let lowFreqEnergy = 0;
    let highFreqEnergy = 0;
    const splitPoint = Math.floor(frequencyData.length * 0.2);
    
    for (let i = 0; i < splitPoint; i++) {
      lowFreqEnergy += frequencyData[i];
    }
    for (let i = splitPoint; i < frequencyData.length / 2; i++) {
      highFreqEnergy += frequencyData[i];
    }
    
    const energyRatio = lowFreqEnergy / (highFreqEnergy + 1);
    
    // Only use energy as secondary confirmation in borderline cases
    if (confidence === "low" && medianPitch >= 155 && medianPitch < 180) {
      if (energyRatio > 1.3) {
        // Strong male energy signature
        detectedGender = "Male";
        confidence = "medium";
      } else if (energyRatio < 0.9 && medianPitch > 170) {
        // Strong female energy signature
        detectedGender = "Female";
        confidence = "medium";
      }
    }

    // Estimate age based on voice characteristics - 5 YEAR RANGE ONLY (IMPROVED)
    let ageRange = "25-30";
    
    if (detectedGender === "Male") {
      // Male voice age estimation (5 year ranges) - CORRECTED for Indian males
      if (medianPitch > 150) {
        ageRange = "18-23"; // High pitch for male = younger (teenager/young adult)
      } else if (medianPitch > 135) {
        ageRange = "20-25"; // Young adult
      } else if (medianPitch > 120) {
        ageRange = "25-30"; // Adult
      } else if (medianPitch > 105) {
        ageRange = "30-35"; // Mature adult
      } else if (medianPitch > 90) {
        ageRange = "35-40"; // Middle age
      } else {
        ageRange = "40-50"; // Older/deeper voice
      }
    } else if (detectedGender === "Female") {
      // Female voice age estimation (5 year ranges) - CORRECTED thresholds
      if (medianPitch > 230) {
        ageRange = "18-23"; // Very high pitch = younger (teenager/young adult)
      } else if (medianPitch > 210) {
        ageRange = "20-25"; // Young adult
      } else if (medianPitch > 195) {
        ageRange = "25-30"; // Adult
      } else if (medianPitch > 180) {
        ageRange = "30-35"; // Mature adult
      } else if (medianPitch > 165) {
        ageRange = "35-40"; // Middle age
      } else {
        ageRange = "40-50"; // Older/deeper voice for female
      }
    } else {
      // Unknown gender - conservative estimation (5 year ranges)
      if (medianPitch > 210) {
        ageRange = "18-25";
      } else if (medianPitch > 170) {
        ageRange = "25-30";
      } else if (medianPitch > 130) {
        ageRange = "30-40";
      } else {
        ageRange = "35-45";
      }
    }

    // IMPROVED Language detection with spectral analysis
    let detectedLanguage = "Analyzing...";
    
    const pitchVariation = Math.max(...trimmedPitches) - Math.min(...trimmedPitches);
    const avgPitch = trimmedPitches.reduce((a, b) => a + b, 0) / trimmedPitches.length;
    
    // Calculate pitch changes (how much pitch jumps around)
    let pitchChanges = 0;
    for (let i = 1; i < pitchHistoryRef.current.length; i++) {
      const diff = Math.abs(pitchHistoryRef.current[i] - pitchHistoryRef.current[i-1]);
      if (diff > 10) pitchChanges++;
    }
    const pitchChangeRate = pitchChanges / pitchHistoryRef.current.length;
    
    // More sophisticated language detection
    if (pitchChangeRate > 0.6 && pitchVariation > 80) {
      // Very tonal - Hindi/Urdu characteristics
      detectedLanguage = "Hindi";
    } else if (pitchChangeRate > 0.5 && pitchVariation > 70 && avgPitch > 150) {
      // High energy tonal - Punjabi characteristics
      detectedLanguage = "Punjabi";
    } else if (pitchChangeRate > 0.4 && pitchVariation > 50) {
      // Medium tonal - Indian English or Hindi mix
      detectedLanguage = "Hinglish (Hindi+English)";
    } else if (pitchChangeRate < 0.3 && pitchVariation < 50) {
      // Flat intonation - American/British English
      detectedLanguage = "English (Native)";
    } else if (pitchVariation > 40 && pitchVariation < 70) {
      // Moderate variation - Indian English
      detectedLanguage = "English (Indian)";
    } else {
      // Default
      detectedLanguage = "English";
    }

    // Detect Emotion based on pitch and energy
    let detectedEmotion = "Neutral";
    
    if (rms > 0.15) {
      detectedEmotion = medianPitch > 200 ? "Excited" : "Angry";
    } else if (rms > 0.08) {
      detectedEmotion = medianPitch > 180 ? "Happy" : "Confident";
    } else if (rms < 0.03) {
      detectedEmotion = "Sad/Tired";
    } else {
      detectedEmotion = "Neutral";
    }

    // Detect Accent/Region based on pitch patterns
    let detectedAccent = "Standard";
    
    if (pitchChangeRate > 0.5 && medianPitch > 180) {
      detectedAccent = "North Indian";
    } else if (pitchChangeRate < 0.3 && medianPitch < 140) {
      detectedAccent = "South Indian";
    } else if (pitchChangeRate > 0.45 && medianPitch > 160 && medianPitch < 200) {
      detectedAccent = "Punjabi";
    } else if (pitchChangeRate < 0.25 && pitchVariation < 40) {
      detectedAccent = "American/British";
    } else if (pitchChangeRate > 0.35 && pitchVariation > 50) {
      detectedAccent = "Indian English";
    } else {
      detectedAccent = "Neutral";
    }

    // Detect Speech Rate
    const analysisCount = pitchHistoryRef.current.length;
    let speechRate = "Normal";
    
    if (analysisCount > 25) {
      speechRate = "Fast";
    } else if (analysisCount > 15) {
      speechRate = "Normal";
    } else {
      speechRate = "Slow";
    }

    console.log(`🎤 Analysis - Samples: ${trimmedPitches.length}, Stability: ${isStable ? 'Stable' : 'Unstable'}`);
    console.log(`   Pitch: ${medianPitch.toFixed(1)}Hz (±${pitchStdDev.toFixed(1)}), Variation: ${pitchVariation.toFixed(1)}Hz`);
    console.log(`   → ${detectedGender} (${confidence}) | Age: ${ageRange} | Audio-Lang: ${detectedLanguage} | ${detectedEmotion}`);

    // Use language from speech recognition if available, otherwise use audio-based detection
    const finalLanguage = detectedLanguageFromSpeech || detectedLanguage;

    setAnalysis({
      gender: detectedGender,
      age_range: ageRange,
      confidence,
      language: finalLanguage,
      emotion: detectedEmotion,
      accent: detectedAccent,
      speechRate: speechRate
    });
  };

  // Autocorrelation function for pitch detection
  const autoCorrelate = (buffer: Uint8Array, sampleRate: number): number => {
    const SIZE = buffer.length;
    const MAX_SAMPLES = Math.floor(SIZE / 2);
    let best_offset = -1;
    let best_correlation = 0;
    let rms = 0;

    // Convert to normalized values
    const normalized = new Float32Array(SIZE);
    for (let i = 0; i < SIZE; i++) {
      const val = (buffer[i] - 128) / 128;
      normalized[i] = val;
      rms += val * val;
    }
    rms = Math.sqrt(rms / SIZE);
    
    if (rms < 0.01) return -1; // Signal too quiet

    // Find the best correlation
    let lastCorrelation = 1;
    for (let offset = 1; offset < MAX_SAMPLES; offset++) {
      let correlation = 0;
      for (let i = 0; i < MAX_SAMPLES; i++) {
        correlation += Math.abs(normalized[i] - normalized[i + offset]);
      }
      correlation = 1 - (correlation / MAX_SAMPLES);
      
      if (correlation > 0.9 && correlation > lastCorrelation) {
        const foundGoodCorrelation = correlation > best_correlation;
        if (foundGoodCorrelation) {
          best_correlation = correlation;
          best_offset = offset;
        }
      }
      lastCorrelation = correlation;
    }

    if (best_offset === -1) return -1;
    
    return sampleRate / best_offset;
  };

  const startRealRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: false
        } 
      });
      streamRef.current = stream;
      
      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;
      
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 4096; // Higher resolution for better pitch detection
      analyser.smoothingTimeConstant = 0.8; // Smooth out rapid fluctuations
      source.connect(analyser);
      analyserRef.current = analyser;

      // Start continuous voice analysis (every 100ms)
      const intervalId = window.setInterval(() => {
        analyzeVoiceContinuously();
      }, 100);
      analysisIntervalRef.current = intervalId;

      // Setup speech recognition for live transcript
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true; // Enable live transcription
        
        // Start with English by default (better for mixed content)
        recognition.lang = 'en-IN';
        setCurrentRecognitionLang('en-IN');
        
        console.log('🎤 Speech Recognition started with lang: en-IN');

        recognition.onresult = (event: SpeechRecognitionEvent) => {
          // Get all results including interim ones for live transcription
          let interimTranscript = '';
          let finalTranscript = '';
          
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            
            if (event.results[i].isFinal) {
              finalTranscript += transcript + ' ';
            } else {
              interimTranscript += transcript;
            }
          }
          
          // If we have final transcript, add it to history
          if (finalTranscript.trim()) {
            const text = finalTranscript.trim();
            
            // Detect language from actual spoken text
            const detectedLang = detectLanguageFromText(text);
            setDetectedLanguageFromSpeech(detectedLang);
            
            // Get optimal recognition language for NEXT utterance
            const optimalLang = getRecognitionLangCode(detectedLang);
            
            // Switch recognition language if needed (with debounce)
            if (optimalLang !== currentRecognitionLang && optimalLang !== lastDetectedLangRef.current) {
              if (languageSwitchTimeoutRef.current) {
                clearTimeout(languageSwitchTimeoutRef.current);
              }
              
              // Switch after detecting pattern (2 seconds debounce)
              languageSwitchTimeoutRef.current = window.setTimeout(() => {
                switchRecognitionLanguage(optimalLang);
              }, 2000);
            }
            
            // Add to transcript history
            setTranscript(prev => [...prev, text]);
            
            console.log(`📝 Final: "${text}" | Detected: ${detectedLang} | Current Mode: ${currentRecognitionLang} | Next Mode: ${optimalLang}`);
          }
          
          // Show interim results in console for debugging
          if (interimTranscript.trim()) {
            console.log(`🔄 Live: "${interimTranscript}"`);
          }
        };

        recognition.onerror = (event) => {
          console.error('Speech recognition error:', event);
        };

        recognition.onend = () => {
          if (isActive) {
            recognition.start(); // Restart if still active
          }
        };

        recognition.start();
        recognitionRef.current = recognition;
      }

      setIsActive(true);
    } catch (error) {
      console.error("Failed to start voice analysis:", error);
      alert("Failed to access microphone. Please ensure microphone permissions are granted.");
      setIsActive(false);
    }
  };

  const stopRecording = () => {
    setIsActive(false);
    
    // Clear language switch timeout
    if (languageSwitchTimeoutRef.current) {
      clearTimeout(languageSwitchTimeoutRef.current);
      languageSwitchTimeoutRef.current = null;
    }
    
    // Stop continuous analysis
    if (analysisIntervalRef.current) {
      clearInterval(analysisIntervalRef.current);
      analysisIntervalRef.current = null;
    }
    
    // Stop speech recognition
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    
    // Stop audio analysis
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    
    analyserRef.current = null;
    pitchHistoryRef.current = [];
    setSimIndex(999); // Stop demo if running
  };

  // Demo mode
  const startSimulation = () => {
    setIsActive(true);
    setAnalysis(null);
    setUseDemo(true);
    setSimIndex(0);
  };

  useEffect(() => {
    if (!isActive || !useDemo || simIndex >= MOCK_CONVERSATION.length) return;

    const step = MOCK_CONVERSATION[simIndex];
    
    const timer = setTimeout(() => {
      if (step.analysis) setAnalysis(step.analysis);
      
      setSimIndex(prev => prev + 1);
      
      if (simIndex + 1 >= MOCK_CONVERSATION.length) {
        setIsActive(false);
        setUseDemo(false);
      }
    }, step.delay);

    return () => clearTimeout(timer);
  }, [isActive, useDemo, simIndex]);

  useEffect(() => {
    return () => {
      if (analysisIntervalRef.current) {
        clearInterval(analysisIntervalRef.current);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  return (
    <div className="relative min-h-screen w-full flex flex-col bg-gradient-to-br from-background via-background to-primary/5 overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 opacity-30">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url(${generatedImage})`,
            filter: 'blur(2px)',
            transform: 'scale(1.1)'
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/50 to-background" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col h-screen">
        {/* Header */}
        <header className="border-b bg-card/50 backdrop-blur-sm">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className={`w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary/50 flex items-center justify-center ${isActive ? 'animate-pulse' : ''}`}>
                  {isActive ? <Mic className="w-6 h-6 text-primary-foreground" /> : <MicOff className="w-6 h-6 text-primary-foreground" />}
                </div>
                {isActive && (
                  <div className="absolute -inset-1 rounded-full bg-primary/20 animate-ping" />
                )}
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/50 bg-clip-text text-transparent">
                  Voice Persona
                </h1>
                <p className="text-sm text-muted-foreground">
                  {isActive ? "Live Analysis" : "Standby"}
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 container mx-auto px-4 py-6 flex gap-6 overflow-hidden">
          {/* Left Panel - Controls and Analysis */}
          <div className="w-full lg:w-2/5 flex flex-col gap-4">
            {/* Audio Visualizer */}
            <div className="bg-card/50 backdrop-blur-sm border rounded-lg p-6">
              <AudioVisualizer isActive={isActive} />
            </div>

            {/* Controls */}
            <div className="bg-card/50 backdrop-blur-sm border rounded-lg p-6 flex flex-col gap-4">
              <h2 className="text-lg font-semibold">Voice Analysis Controls</h2>
              
              <div className="flex gap-2">
                {!isActive ? (
                  <>
                    <Button
                      onClick={startRealRecording}
                      size="lg"
                      className="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
                    >
                      <Mic className="w-5 h-5 mr-2" />
                      START ANALYSIS
                    </Button>
                    <Button
                      onClick={startSimulation}
                      size="lg"
                      variant="outline"
                      className="flex-1"
                    >
                      <Play className="w-5 h-5 mr-2" />
                      DEMO MODE
                    </Button>
                  </>
                ) : (
                  <Button
                    onClick={stopRecording}
                    size="lg"
                    variant="destructive"
                    className="w-full"
                  >
                    <MicOff className="w-5 h-5 mr-2" />
                    STOP
                  </Button>
                )}
              </div>

              <Button
                onClick={() => { stopRecording(); setAnalysis(null); }}
                variant="outline"
                size="sm"
                disabled={!analysis}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Reset Analysis
              </Button>

              <div className="text-sm text-muted-foreground space-y-1">
                <p>• Click "START ANALYSIS" to begin real-time voice analysis</p>
                <p>• Speak naturally for accurate gender and age detection</p>
                <p>• Analysis based on pitch, frequency, and energy levels</p>
              </div>
            </div>

            {/* Analysis Panel */}
            {analysis && (
              <div className="bg-card/50 backdrop-blur-sm border rounded-lg overflow-hidden">
                <AnalysisPanel data={analysis} />
              </div>
            )}
          </div>

          {/* Right Panel - Live Transcript */}
          <div className="hidden lg:block flex-1">
            <div className="bg-card/50 backdrop-blur-sm border rounded-lg p-6 h-full flex flex-col">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                  📝
                </div>
                Live Transcript
              </h2>
              
              {/* Transcript Display */}
              <div className="flex-1 overflow-y-auto space-y-2 bg-background/50 rounded-lg p-4 border">
                {transcript.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    <p className="text-sm">Start speaking to see live transcription...</p>
                  </div>
                ) : (
                  transcript.map((text, index) => (
                    <div 
                      key={index}
                      className="bg-primary/10 border border-primary/20 rounded-lg p-3 animate-in fade-in slide-in-from-bottom-2"
                    >
                      <p className="text-sm text-foreground">{text}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date().toLocaleTimeString()}
                      </p>
                    </div>
                  ))
                )}
              </div>

              {/* Clear Transcript Button */}
              {transcript.length > 0 && (
                <Button
                  onClick={() => setTranscript([])}
                  variant="outline"
                  size="sm"
                  className="mt-4"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Clear Transcript
                </Button>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
