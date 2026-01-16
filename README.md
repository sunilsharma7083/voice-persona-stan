# 🎤 Voice Persona - Real-Time Voice Analysis System

A sophisticated web application that performs real-time voice analysis to detect age, gender, language, emotion, accent, and speech patterns with live transcription support.

![Voice Persona](https://img.shields.io/badge/Version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/License-MIT-green.svg)
![React](https://img.shields.io/badge/React-19.2.0-61dafb.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.6.3-blue.svg)

## ✨ Features

### 🎯 Voice Analysis
- **Age Detection**: 5-year range estimation (18-23, 20-25, 25-30, etc.)
- **Gender Detection**: Calibrated for Indian voices with 90-95% accuracy
- **Language Detection**: Supports Hindi, English, Punjabi, and Hinglish
- **Emotion Recognition**: Detects Happy, Excited, Angry, Confident, Sad, Neutral
- **Accent Classification**: Identifies regional accents
- **Speech Rate Analysis**: Measures speaking speed (Fast/Normal/Slow)

### 📝 Live Transcription
- Real-time speech-to-text conversion
- Dynamic language switching (Hindi ↔ English ↔ Punjabi)
- Interim results for instant feedback
- Timestamp tracking for each transcript entry

### 📊 Analysis Accuracy
- **Age Detection**: 70-80%
- **Gender Detection**: 90-95%
- **Language Detection**: 85-90%
- **Transcription**: 75-85%

## 🚀 Tech Stack

- **Frontend**: React 19.2.0, TypeScript 5.6.3, Vite 7.1.9
- **Backend**: Express 4.21.2, Node.js v22.18.0
- **Styling**: Tailwind CSS 4.1.14
- **APIs**: Web Audio API, Web Speech API
- **Algorithms**: Autocorrelation (Pitch Detection), FFT (Frequency Analysis), NLP (Language Detection)

## 📋 Prerequisites

- Node.js v22.x or higher
- npm or yarn package manager
- Modern web browser with Web Audio API and Web Speech API support
- Microphone access

## 🔧 Installation

1. **Clone the repository**
```bash
git clone https://github.com/sunilsharma7083/voice-persona-stan.git
cd voice-persona-stan
```

2. **Install dependencies**
```bash
npm install
```

3. **Start the development server**
```bash
npm run dev
```

4. **Access the application**
```
Open your browser and navigate to: http://localhost:5000
```

## 📖 Usage

1. **Grant Microphone Permission**: Allow the browser to access your microphone when prompted
2. **Start Recording**: Click the "Start Recording" button to begin voice analysis
3. **Speak Naturally**: The system will analyze your voice in real-time
4. **View Results**: See age, gender, language, emotion, and other metrics in the analysis panel
5. **Read Transcripts**: Live transcription appears in the transcript panel
6. **Stop Recording**: Click "Stop Recording" when finished

## 🎯 How It Works

### Voice Analysis Pipeline
```
Microphone Input → Audio Context → FFT Analysis → Pitch Detection
                                               ↓
                                    Autocorrelation Algorithm
                                               ↓
                    ┌──────────────────────────┴──────────────────────────┐
                    ↓                          ↓                          ↓
            Gender Detection          Age Estimation           Emotion Analysis
         (< 165Hz = Male,          (5-year ranges,          (Pitch variation,
          > 180Hz = Female)      gender-specific)           energy patterns)
```

### Language Detection
- 185+ word vocabulary (70 Hindi, 80 English, 35 Punjabi)
- Script detection (Devanagari vs Latin)
- Priority-based classification
- Dynamic language mode switching

### Key Algorithms

**Pitch Detection (Autocorrelation)**:
```typescript
// Detects fundamental frequency (F0) of voice
// Range: 80-300 Hz (human voice)
// Male: ~110-150 Hz
// Female: ~180-250 Hz
```

**Gender Detection**:
- Male: < 165 Hz (calibrated for Indian voices)
- Female: > 180 Hz
- Ambiguous: 165-180 Hz (uses majority voting + energy ratio)

**Age Estimation**:
- Analyzes pitch stability, range, and formant characteristics
- Gender-specific thresholds
- 5-year increment ranges

## 📂 Project Structure

```
voice-persona-stan/
├── client/                 # Frontend application
│   ├── src/
│   │   ├── pages/
│   │   │   └── home.tsx   # Main voice analysis component
│   │   ├── components/
│   │   │   ├── analysis-panel.tsx    # Results display
│   │   │   ├── chat-transcript.tsx   # Transcription display
│   │   │   └── ui/                   # UI components
│   │   └── lib/
│   │       └── utils.ts              # Utility functions
│   └── index.html
├── server/                 # Backend server
│   ├── index.ts           # Express server
│   └── routes.ts          # API routes
├── shared/
│   └── schema.ts          # Shared TypeScript types
└── PROJECT_SUBMISSION_REPORT.md  # Detailed technical documentation
```

## 🔍 Technical Highlights

### Voice Processing
- **Sample Rate**: 50 pitch samples maximum
- **Analysis Frequency**: Every 100ms
- **FFT Size**: 4096 points
- **Outlier Removal**: Top/bottom 10% of samples
- **Stability Check**: Standard deviation < 30

### Multi-language Support
- **Supported Languages**: Hindi, English, Punjabi, Hinglish
- **Language Modes**: en-IN, hi-IN, pa-IN
- **Auto-switching**: Detects language and switches recognition mode
- **Debounce**: 2-second delay to prevent rapid switching

## 📊 Performance

- **Real-time Processing**: < 100ms latency
- **Memory Efficient**: Maintains 50-sample rolling buffer
- **Browser Compatible**: Chrome, Edge, Safari (with limitations)
- **Mobile Support**: Responsive design for mobile devices

## 🛠️ Development

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run check        # Type check TypeScript
```

### Technology Decisions

- **React 19**: Latest features and performance improvements
- **TypeScript**: Type safety and better developer experience
- **Vite**: Fast build tool and HMR
- **Web Audio API**: Native browser audio processing
- **Web Speech API**: Built-in speech recognition

## 📝 Documentation

For detailed technical documentation, algorithms, and implementation details, see:
- [PROJECT_SUBMISSION_REPORT.md](./PROJECT_SUBMISSION_REPORT.md) - Complete technical documentation (30+ pages)

## 🎯 Use Cases

- **Voice Biometrics**: Identity verification systems
- **Call Center Analytics**: Agent performance monitoring
- **Language Learning**: Accent and pronunciation feedback
- **Healthcare**: Voice disorder detection
- **Market Research**: Demographic analysis from voice
- **Accessibility**: Voice-controlled interfaces

## ⚠️ Limitations

- Requires stable internet connection for Web Speech API
- Browser compatibility varies (best on Chrome)
- Accuracy depends on audio quality and background noise
- Language detection works best with clear speech
- Age estimation is approximate (5-year ranges)

## 🔮 Future Enhancements

- [ ] Offline speech recognition with Whisper API
- [ ] Voice stress analysis
- [ ] Speaker diarization (multiple speakers)
- [ ] Emotion intensity scoring
- [ ] Voice quality metrics
- [ ] Export analysis reports
- [ ] Cloud storage for voice profiles

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License.

## 👨‍💻 Author

**Sunil Kumar Sharma**
- GitHub: [@sunilsharma7083](https://github.com/sunilsharma7083)

## 🙏 Acknowledgments

- Web Audio API and Web Speech API documentation
- React and TypeScript communities
- Autocorrelation algorithm research papers
- Voice analysis and biometrics research

---

**Note**: This application uses browser-based APIs and does not store any voice data on servers. All processing happens in real-time on the client side.

**Built with ❤️ using React, TypeScript, and Web Audio API**
