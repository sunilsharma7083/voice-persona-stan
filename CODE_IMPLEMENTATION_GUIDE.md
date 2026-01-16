# 🔬 Voice Analysis Code Implementation Guide

**Where & How the Analysis is Computed**

---

## 📍 Main Implementation File

**File Location**: `/client/src/pages/home.tsx`  
**Total Lines**: 903 lines  
**Core Analysis Function**: `analyzeVoiceContinuously()` (Lines 228-508)

---

## 🎯 Core Analysis Flow

```
User clicks "Start Recording"
         ↓
   startRealRecording() [Lines 580-659]
         ↓
   getUserMedia() → AudioContext → AnalyserNode
         ↓
   Analysis Loop (every 100ms) [Line 591]
         ↓
   analyzeVoiceContinuously() [Lines 228-508]
         ↓
   ┌──────────────────────────────────────┐
   │  1. Get audio data                   │
   │  2. Check if speaking (RMS > 0.01)   │
   │  3. Detect pitch (autocorrelation)   │
   │  4. Store in history (50 samples)    │
   │  5. Remove outliers                  │
   │  6. Calculate median pitch           │
   │  7. Detect gender from pitch         │
   │  8. Estimate age from pitch+gender   │
   │  9. Analyze emotion from energy      │
   │  10. Detect language from patterns   │
   └──────────────────────────────────────┘
         ↓
   setAnalysis() → Update UI
```

---

## 🔍 Key Code Sections

### 1. **Pitch Detection Algorithm** (Lines 545-578)

**Location**: `autoCorrelate()` function

```typescript
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
  
  return sampleRate / best_offset; // Convert to Hz
};
```

**What it does**:
- Takes raw audio buffer (Uint8Array)
- Normalizes values to -1 to 1 range
- Finds repeating patterns in the waveform
- Returns fundamental frequency in Hz

---

### 2. **Gender Detection** (Lines 298-375)

**Location**: Inside `analyzeVoiceContinuously()`

```typescript
// Remove outliers for better accuracy
const sortedPitches = [...pitchHistoryRef.current].sort((a, b) => a - b);
const trimAmount = Math.floor(sortedPitches.length * 0.1);
const trimmedPitches = sortedPitches.slice(trimAmount, sortedPitches.length - trimAmount);

// Use median from trimmed data
const medianPitch = trimmedPitches[Math.floor(trimmedPitches.length / 2)];

// Calculate consistency (how stable the pitch is)
const pitchStdDev = Math.sqrt(
  trimmedPitches.reduce((sum, p) => sum + Math.pow(p - medianPitch, 2), 0) / trimmedPitches.length
);
const isStable = pitchStdDev < 30;

let detectedGender: "Male" | "Female" | "Unknown" = "Unknown";
let confidence: "low" | "medium" | "high" = "low";

if (medianPitch < 165) {
  // Male range (calibrated for Indian voices)
  detectedGender = "Male";
  if (medianPitch < 140 && isStable) {
    confidence = "high";
  } else if (medianPitch < 155) {
    confidence = "medium";
  } else {
    confidence = "low";
  }
} else if (medianPitch >= 165 && medianPitch < 180) {
  // Ambiguous range - use voting
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
  
  if (maleCount > femaleCount || energyRatio > 1.2) {
    detectedGender = "Male";
    confidence = "low";
  } else {
    detectedGender = "Female";
    confidence = "low";
  }
} else if (medianPitch >= 180) {
  // Female range
  detectedGender = "Female";
  confidence = medianPitch > 220 && isStable ? "high" : "medium";
}
```

**What it does**:
- Takes 50 pitch samples from history
- Removes outliers (top/bottom 10%)
- Calculates median pitch
- Classifies: Male (<165Hz), Female (>180Hz), Ambiguous (165-180Hz)
- Uses energy distribution for ambiguous cases
- Returns gender + confidence level

---

### 3. **Age Estimation** (Lines 376-411)

**Location**: Inside `analyzeVoiceContinuously()`

```typescript
let ageRange = "25-30";

if (detectedGender === "Male") {
  // Male voice age estimation (5 year ranges)
  if (medianPitch > 150) {
    ageRange = "18-23"; // High pitch = younger
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
  // Female voice age estimation (5 year ranges)
  if (medianPitch > 230) {
    ageRange = "18-23"; // Very high pitch = younger
  } else if (medianPitch > 210) {
    ageRange = "20-25"; // Young adult
  } else if (medianPitch > 195) {
    ageRange = "25-30"; // Adult
  } else if (medianPitch > 180) {
    ageRange = "30-35"; // Mature adult
  } else if (medianPitch > 165) {
    ageRange = "35-40"; // Middle age
  } else {
    ageRange = "40-50"; // Older/deeper voice
  }
}
```

**What it does**:
- Uses median pitch + detected gender
- Maps pitch ranges to age groups
- Different thresholds for male/female
- Returns 5-year age range

---

### 4. **Language Detection** (Lines 412-456)

**Location**: Inside `analyzeVoiceContinuously()`

```typescript
// Calculate pitch variation and change rate
const pitchVariation = Math.max(...trimmedPitches) - Math.min(...trimmedPitches);
const avgPitch = trimmedPitches.reduce((a, b) => a + b, 0) / trimmedPitches.length;

let pitchChanges = 0;
for (let i = 1; i < pitchHistoryRef.current.length; i++) {
  const diff = Math.abs(pitchHistoryRef.current[i] - pitchHistoryRef.current[i-1]);
  if (diff > 10) pitchChanges++;
}
const pitchChangeRate = pitchChanges / pitchHistoryRef.current.length;

// Sophisticated language detection
if (pitchChangeRate > 0.6 && pitchVariation > 80) {
  detectedLanguage = "Hindi"; // Very tonal
} else if (pitchChangeRate > 0.5 && pitchVariation > 70 && avgPitch > 150) {
  detectedLanguage = "Punjabi"; // High energy tonal
} else if (pitchChangeRate > 0.4 && pitchVariation > 50) {
  detectedLanguage = "Hinglish (Hindi+English)";
} else if (pitchChangeRate < 0.3 && pitchVariation < 50) {
  detectedLanguage = "English (Native)"; // Flat intonation
} else if (pitchVariation > 40 && pitchVariation < 70) {
  detectedLanguage = "English (Indian)"; // Moderate variation
} else {
  detectedLanguage = "English";
}
```

**What it does**:
- Analyzes pitch variation patterns
- Calculates pitch change rate
- Maps patterns to language characteristics
- Hindi = high tonal variation
- English = flat intonation
- Punjabi = very high energy

**Enhanced with Text Analysis** (Lines 73-170):

```typescript
const detectLanguageFromText = (text: string): string => {
  const lowerText = text.toLowerCase().trim();
  const words = lowerText.split(/\s+/);
  
  // Check for Devanagari script (Hindi)
  const hasDevanagari = /[\u0900-\u097F]/.test(text);
  if (hasDevanagari) return "Hindi";
  
  // Check for Gurmukhi script (Punjabi)
  const hasGurmukhi = /[\u0A00-\u0A7F]/.test(text);
  if (hasGurmukhi) return "Punjabi";
  
  // 185+ word dictionary matching
  const hindiWords = ['namaste', 'main', 'hoon', 'kya', 'kaise', ...];
  const englishWords = ['hello', 'how', 'are', 'you', 'what', ...];
  const punjabiWords = ['sat', 'sri', 'akal', 'ki', 'haal', ...];
  
  let hindiScore = 0;
  let englishScore = 0;
  let punjabiScore = 0;
  
  words.forEach(word => {
    if (hindiWords.includes(word)) hindiScore++;
    if (englishWords.includes(word)) englishScore++;
    if (punjabiWords.includes(word)) punjabiScore++;
  });
  
  // Priority: Hindi > Punjabi > English
  if (hindiScore >= 2) return "Hindi";
  if (punjabiScore >= 2) return "Punjabi";
  if (englishScore >= 3) return "English";
  
  return "English"; // Default
};
```

---

### 5. **Emotion Recognition** (Lines 457-467)

**Location**: Inside `analyzeVoiceContinuously()`

```typescript
// Detect Emotion based on pitch and energy
let detectedEmotion = "Neutral";

if (rms > 0.15) {
  // High energy
  detectedEmotion = medianPitch > 200 ? "Excited" : "Angry";
} else if (rms > 0.08) {
  // Medium energy
  detectedEmotion = medianPitch > 180 ? "Happy" : "Confident";
} else if (rms < 0.03) {
  // Low energy
  detectedEmotion = "Sad/Tired";
} else {
  detectedEmotion = "Neutral";
}
```

**What it does**:
- Measures RMS (root mean square) energy
- Combines energy with pitch
- High energy + high pitch = Excited
- High energy + low pitch = Angry
- Low energy = Sad
- Medium = Neutral/Happy/Confident

---

### 6. **Accent Detection** (Lines 468-484)

**Location**: Inside `analyzeVoiceContinuously()`

```typescript
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
```

**What it does**:
- Uses pitch change patterns
- North Indian = high variation
- South Indian = low variation, deeper voice
- Punjabi = moderate-high variation with specific pitch range
- American/British = very flat
- Indian English = moderate variation

---

### 7. **Speech Rate** (Lines 485-493)

**Location**: Inside `analyzeVoiceContinuously()`

```typescript
const analysisCount = pitchHistoryRef.current.length;
let speechRate = "Normal";

if (analysisCount > 25) {
  speechRate = "Fast";
} else if (analysisCount > 15) {
  speechRate = "Normal";
} else {
  speechRate = "Slow";
}
```

**What it does**:
- Counts number of pitch samples collected
- More samples in same time = faster speech
- Simple but effective heuristic

---

## 🎤 Real-Time Transcription

**Location**: Lines 600-659

```typescript
// Speech Recognition setup
const recognition = new SpeechRecognition();
recognition.continuous = true;
recognition.interimResults = true; // Live transcription
recognition.lang = 'en-IN'; // Start with English-India

recognition.onresult = (event: SpeechRecognitionEvent) => {
  let interimTranscript = '';
  let finalTranscript = '';
  
  for (let i = event.resultIndex; i < event.results.length; i++) {
    const transcript = event.results[i][0].transcript;
    
    if (event.results[i].isFinal) {
      finalTranscript += transcript + ' ';
      
      // Detect language from actual text
      const detectedLang = detectLanguageFromText(transcript);
      setDetectedLanguageFromSpeech(detectedLang);
      
      // Switch recognition language dynamically
      if (detectedLang === "Hindi") {
        switchRecognitionLanguage('hi-IN');
      } else if (detectedLang === "Punjabi") {
        switchRecognitionLanguage('pa-IN');
      } else {
        switchRecognitionLanguage('en-IN');
      }
      
      // Add to transcript with timestamp
      setTranscript(prev => [...prev, `${new Date().toLocaleTimeString()}: ${transcript}`]);
    } else {
      interimTranscript += transcript;
    }
  }
};
```

**What it does**:
- Uses Web Speech API (Google's ML models)
- Provides interim results (live text)
- Detects language from transcribed text
- Dynamically switches recognition mode
- Adds timestamps to transcript

---

## 🔄 Dynamic Language Switching

**Location**: Lines 179-227

```typescript
const switchRecognitionLanguage = (newLang: string) => {
  if (newLang === currentRecognitionLang) return;
  
  // Debounce language switching (avoid rapid changes)
  if (languageSwitchTimeoutRef.current) {
    clearTimeout(languageSwitchTimeoutRef.current);
  }
  
  languageSwitchTimeoutRef.current = window.setTimeout(() => {
    restartRecognitionWithLanguage(newLang);
  }, 2000); // Wait 2 seconds before switching
};

const restartRecognitionWithLanguage = (newLang: string) => {
  if (!recognitionRef.current || newLang === lastDetectedLangRef.current) {
    return;
  }
  
  console.log(`🔄 Switching recognition from ${currentRecognitionLang} to ${newLang}`);
  
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
    }, 300); // Wait 300ms before restarting
  } catch (e) {
    console.log('Recognition stop error:', e);
  }
};
```

**What it does**:
- Monitors detected language
- Stops current recognition
- Changes language mode (en-IN → hi-IN → pa-IN)
- Restarts recognition with new language
- 2-second debounce to prevent rapid switching

---

## 📊 Data Flow Summary

```
┌─────────────────────────────────────────────────────────┐
│              Audio Input (Microphone)                   │
└────────────────────┬────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────────────┐
│     getUserMedia() → MediaStream (Line 581)             │
└────────────────────┬────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────────────┐
│   AudioContext → AnalyserNode (Lines 583-590)           │
│   - FFT Size: 4096                                      │
│   - Smoothing: 0.8                                      │
└────────────────────┬────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────────────┐
│   Every 100ms: analyzeVoiceContinuously() (Line 591)    │
└────────────────────┬────────────────────────────────────┘
                     ↓
    ┌───────────────┴───────────────┐
    ↓                               ↓
┌──────────────┐            ┌──────────────────┐
│  Time Domain │            │  Frequency Data  │
│  Analysis    │            │  Analysis        │
│  (Line 234)  │            │  (Line 236)      │
└──────┬───────┘            └──────┬───────────┘
       ↓                           ↓
┌──────────────┐            ┌──────────────────┐
│  RMS Energy  │            │  FFT Spectrum    │
│  (Lines      │            │  (Used for       │
│  238-244)    │            │  gender/accent)  │
└──────┬───────┘            └──────────────────┘
       ↓
┌─────────────────────────────────────────────────────────┐
│   autoCorrelate() - Pitch Detection (Lines 545-578)     │
│   Input: Uint8Array buffer                              │
│   Output: Frequency in Hz                               │
└────────────────────┬────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────────────┐
│   Pitch History Buffer (50 samples) (Line 265)          │
└────────────────────┬────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────────────┐
│   Outlier Removal (Top/Bottom 10%) (Lines 275-279)      │
└────────────────────┬────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────────────┐
│   Statistical Analysis                                  │
│   - Median Pitch (Line 281)                             │
│   - Standard Deviation (Lines 284-287)                  │
│   - Stability Check (Line 288)                          │
└────────────────────┬────────────────────────────────────┘
                     ↓
    ┌───────────────┴────────────────┬────────────────┐
    ↓                                ↓                ↓
┌──────────┐                  ┌──────────┐    ┌──────────┐
│  Gender  │                  │   Age    │    │ Language │
│(Lines    │                  │ (Lines   │    │ (Lines   │
│298-375)  │                  │376-411)  │    │412-456)  │
└──────────┘                  └──────────┘    └──────────┘
    ↓                                ↓                ↓
    └────────────────┬───────────────┴────────────────┘
                     ↓
┌─────────────────────────────────────────────────────────┐
│   Additional Features                                   │
│   - Emotion (Lines 457-467)                             │
│   - Accent (Lines 468-484)                              │
│   - Speech Rate (Lines 485-493)                         │
└────────────────────┬────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────────────┐
│   setAnalysis() - Update React State (Line 507)         │
└────────────────────┬────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────────────┐
│   AnalysisPanel Component - Display Results            │
│   (client/src/components/analysis-panel.tsx)           │
└─────────────────────────────────────────────────────────┘
```

---

## 🎯 Interview Answer

**When asked**: *"I cannot see the code where the analysis is computed"*

**Your Answer**:

> "The voice analysis computation is in `/client/src/pages/home.tsx`, specifically in the `analyzeVoiceContinuously()` function starting at line 228. Let me walk you through the key sections:
>
> **1. Audio Capture (Lines 580-590)**: 
> We use `getUserMedia()` to access the microphone, create an `AudioContext`, and connect it to an `AnalyserNode` with FFT size 4096 for high-resolution frequency analysis.
>
> **2. Analysis Loop (Line 591)**: 
> Every 100ms, we call `analyzeVoiceContinuously()` which:
> - Gets time-domain and frequency data from the analyser
> - Calculates RMS energy to detect if someone is speaking
> - Calls `autoCorrelate()` function to detect pitch
>
> **3. Pitch Detection (Lines 545-578)**: 
> The `autoCorrelate()` function implements the autocorrelation algorithm:
> ```typescript
> // Normalizes audio buffer
> // Finds repeating patterns in waveform
> // Returns fundamental frequency in Hz
> ```
>
> **4. Gender Detection (Lines 298-375)**:
> - Collects 50 pitch samples
> - Removes outliers (top/bottom 10%)
> - Calculates median: <165Hz = Male, >180Hz = Female
> - Uses energy distribution for ambiguous cases (165-180Hz)
>
> **5. Age Estimation (Lines 376-411)**:
> - Maps pitch ranges to age groups
> - Gender-specific thresholds
> - Returns 5-year ranges (18-23, 20-25, etc.)
>
> **6. Language Detection (Lines 412-456 + Lines 73-170)**:
> - Audio-based: Analyzes pitch variation patterns
> - Text-based: 185+ word dictionary with script detection
> - Combines both for final classification
>
> **7. Other Features**:
> - Emotion (Lines 457-467): RMS energy + pitch
> - Accent (Lines 468-484): Pitch change patterns
> - Speech Rate (Lines 485-493): Sample count
>
> All computations happen client-side in the browser using Web Audio API for maximum privacy and zero latency. The results update the React state which triggers UI re-rendering through the `AnalysisPanel` component."

---

## 📂 File Structure Reference

```
/client/src/pages/home.tsx (903 lines)
├── Lines 1-72: Imports & TypeScript interfaces
├── Lines 73-170: detectLanguageFromText() - 185+ word dictionary
├── Lines 171-227: Language switching logic
├── Lines 228-508: analyzeVoiceContinuously() - MAIN ANALYSIS
│   ├── Lines 234-244: RMS energy calculation
│   ├── Lines 247-265: Pitch detection & history
│   ├── Lines 268-288: Outlier removal & statistics
│   ├── Lines 291-375: Gender detection
│   ├── Lines 376-411: Age estimation
│   ├── Lines 412-456: Language detection (audio)
│   ├── Lines 457-467: Emotion recognition
│   ├── Lines 468-484: Accent detection
│   └── Lines 485-493: Speech rate
├── Lines 545-578: autoCorrelate() - Pitch algorithm
├── Lines 580-659: startRealRecording() - Setup
├── Lines 660-740: stopRecording() & cleanup
├── Lines 741-820: UI components
└── Lines 821-903: Return JSX

/client/src/components/analysis-panel.tsx
└── Displays analysis results with confidence bars

/client/src/components/chat-transcript.tsx
└── Shows live transcription with timestamps
```

---

## 🔬 Testing the Code

**To see the analysis in action**:

1. Open browser DevTools (F12)
2. Go to Console tab
3. Start recording
4. Look for console logs:

```
🎤 Analysis - Samples: 45, Stability: Stable
   Pitch: 135.2Hz (±12.3), Variation: 45.7Hz
   → Male (high) | Age: 25-30 | Audio-Lang: English (Indian) | Confident
```

**Key Console Logs**:
- Line 495: Main analysis summary
- Line 496: Detailed pitch information
- Line 497: All detection results
- Line 608: Speech recognition language switch
- Line 641: Transcript updates

---

## 💡 Key Insights

1. **All analysis happens in one function**: `analyzeVoiceContinuously()` (Lines 228-508)

2. **Core algorithm**: Autocorrelation pitch detection (Lines 545-578)

3. **Real-time updates**: Every 100ms analysis loop (Line 591)

4. **Privacy-first**: No audio data sent to server - all client-side

5. **Hybrid approach**: Audio analysis + text analysis for language

6. **Statistical robustness**: Outlier removal, median instead of mean

7. **Confidence levels**: Based on pitch stability and sample quality

---

**Document Version**: 1.0.0  
**Last Updated**: January 16, 2026  
**Author**: Sunil Kumar Sharma
