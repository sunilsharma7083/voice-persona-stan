# 🏗️ Voice Persona - System Architecture

Real-time voice analysis system architecture documentation.

---

## 🎯 System Overview

Voice Persona processes audio input through detection algorithms to identify age, gender, language, emotion, accent, and speech patterns with live transcription.

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Client Browser                        │
│  ┌──────────────────────────────────────────────────┐   │
│  │              React Application                   │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────────┐   │   │
│  │  │  Audio   │  │  Voice   │  │ Transcription│   │   │
│  │  │ Capture  │→ │ Analysis │→ │   Display    │   │   │
│  │  └──────────┘  └──────────┘  └──────────────┘   │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
                         ↓ HTTP
┌─────────────────────────────────────────────────────────┐
│                  Express Server (5000)                   │
│        API Routes  |  Static Files  |  Vite Dev         │
└─────────────────────────────────────────────────────────┘
```

---

## 💻 Technology Stack

**Frontend**: React 19.2.0, TypeScript 5.6.3, Vite 7.1.9, Tailwind CSS 4.1.14  
**Backend**: Node.js 22.18.0, Express 4.21.2  
**APIs**: Web Audio API, Web Speech API



### 1. Presentation Layer

```
client/src/
├── pages/home.tsx              # Main voice analysis page
├── components/
│   ├── analysis-panel.tsx      # Results display
│   ├── chat-transcript.tsx     # Live transcription
│   └── audio-visualizer.tsx    # Visual feedback
└── lib/utils.ts                # Utilities
```

### 2. Business Logic Layer

```
Voice Analysis Engine (home.tsx)
├── Audio Context (48000 Hz, FFT 4096)
├── Pitch Detection (Autocorrelation, 80-300 Hz)
└── Feature Extraction
    ├── Gender Detection
    ├── Age Estimation
    ├── Emotion Recognition
    ├── Language Detection
    └── Accent Classification
```

### 3. Server Layer

```
server/
├── index.ts     # Express server
├── routes.ts    # API handlers
└── vite.ts      # Dev server
```



---

## 🔄 Data Flow

```
Microphone → getUserMedia() → AudioContext → AnalyserNode
                                                 ↓
                                    ┌────────────┴────────────┐
                                    ↓                         ↓
                          Time Domain Analysis    SpeechRecognition (STT)
                                    ↓                         ↓
                            Pitch Detection          Live Transcript
                                    ↓
                    ┌───────────────┼───────────────┐
                    ↓               ↓               ↓
                Gender          Age            Language
                Detection    Estimation       Detection
                    ↓               ↓               ↓
                         Analysis Display
```

---

## 🎙️ Voice Analysis Algorithms

### Pitch Detection (Autocorrelation)
- **Range**: 80-300 Hz
- **Buffer**: 50 samples
- **Frequency**: Every 100ms
- **Outlier Removal**: Top/bottom 10%

### Gender Detection
- **Male**: < 165 Hz
- **Female**: > 180 Hz  
- **Ambiguous**: 165-180 Hz (majority voting)

### Age Estimation
- **Method**: Gender-specific pitch ranges
- **Ranges**: 5-year increments (18-23, 20-25, etc.)
- **Confidence**: Based on pitch stability

### Language Detection
- **Dictionary**: 185+ words (70 Hindi, 80 English, 35 Punjabi)
- **Method**: Word matching + script detection
- **Dynamic Switching**: Auto-switch recognition mode (en-IN ↔ hi-IN ↔ pa-IN)

### Emotion Recognition
- **Happy/Excited**: High pitch variance
- **Angry**: High pitch + loud
- **Confident**: Stable + moderate
- **Sad**: Low variance
- **Neutral**: Average all

---

## 🧩 Component Hierarchy

```
App
└── HomePage
    ├── AudioCaptureButton
    ├── AudioVisualizer
    ├── AnalysisPanel
    │   ├── Age Result
    │   ├── Gender Result
    │   ├── Language Result
    │   ├── Emotion Result
    │   ├── Accent Result
    │   └── Speech Rate Result
    └── ChatTranscript
```

---

## 🔒 Security & Privacy

```
Privacy-First Design:
✓ Client-side processing only
✓ No audio recording saved
✓ No data sent to server
✓ Session-only storage
✓ HTTPS in production
✓ Microphone permission required
```

---

## 🚀 Deployment

### Development
```bash
npm install
npm run dev    # Runs on localhost:5000
```

### Production
```bash
npm run build  # Creates dist/ folder
# Deploy to: Vercel, Netlify, or AWS S3
```

---

## 📊 Performance

- **Initial Load**: ~1.5s
- **Analysis Latency**: ~50ms
- **Bundle Size**: ~350KB
- **Memory Usage**: ~75MB

---

**Version**: 1.0.0  
**Author**: Sunil Kumar Sharma
