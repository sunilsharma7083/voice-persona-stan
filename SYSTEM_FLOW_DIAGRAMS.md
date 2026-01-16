# Voice Persona - System Architecture & Flow Diagrams

## 1. Overall System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER INTERFACE                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │  Audio       │  │  Analysis    │  │  Live Transcript     │  │
│  │  Visualizer  │  │  Panel       │  │  Display             │  │
│  └──────────────┘  └──────────────┘  └──────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              ↕
┌─────────────────────────────────────────────────────────────────┐
│                   VOICE ANALYSIS ENGINE                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │  Pitch       │  │  Gender      │  │  Age Detection       │  │
│  │  Detection   │  │  Detection   │  │  Algorithm           │  │
│  └──────────────┘  └──────────────┘  └──────────────────────┘  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │  Language    │  │  Emotion     │  │  Speech Rate         │  │
│  │  Detection   │  │  Detection   │  │  Analysis            │  │
│  └──────────────┘  └──────────────┘  └──────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              ↕
┌─────────────────────────────────────────────────────────────────┐
│                     AUDIO PROCESSING LAYER                       │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Web Audio API (AudioContext)                            │   │
│  │  • AnalyserNode (FFT 4096)                               │   │
│  │  • MediaStreamSource                                     │   │
│  │  • getByteTimeDomainData()                               │   │
│  └──────────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Web Speech API (SpeechRecognition)                      │   │
│  │  • Language Modes: en-IN, hi-IN, pa-IN                   │   │
│  │  • Interim Results + Continuous Mode                     │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              ↕
┌─────────────────────────────────────────────────────────────────┐
│                       MICROPHONE INPUT                           │
│              (getUserMedia API - MediaDevices)                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Age Detection Flow

```
┌──────────────┐
│ Microphone   │
│ Audio Input  │
└──────┬───────┘
       │
       ↓
┌──────────────────────────────┐
│ AudioContext + AnalyserNode  │
│ • FFT 4096 samples           │
│ • Smoothing: 0.8             │
└──────┬───────────────────────┘
       │
       ↓
┌──────────────────────────────┐
│ Autocorrelation Algorithm    │
│ • Analyze waveform pattern   │
│ • Find periodic correlation  │
│ • Calculate frequency (Hz)   │
└──────┬───────────────────────┘
       │
       ↓
┌──────────────────────────────┐
│ Pitch Collection (50 samples)│
│ • Sample every 100ms         │
│ • Validate: 50-500 Hz        │
│ • Store in history array     │
└──────┬───────────────────────┘
       │
       ↓
┌──────────────────────────────┐
│ Outlier Removal              │
│ • Sort pitch array           │
│ • Remove top 10%             │
│ • Remove bottom 10%          │
│ • Keep middle 80%            │
└──────┬───────────────────────┘
       │
       ↓
┌──────────────────────────────┐
│ Statistical Analysis         │
│ • Median pitch               │
│ • Standard deviation         │
│ • isStable = StdDev < 30     │
└──────┬───────────────────────┘
       │
       ↓
┌──────────────────────────────┐
│ Gender-Based Classification  │
│                              │
│ IF Male (< 165 Hz):          │
│   > 130 Hz → 18-23 years     │
│   > 120 Hz → 20-25 years     │
│   > 110 Hz → 25-30 years     │
│   > 100 Hz → 30-35 years     │
│   > 90 Hz  → 35-40 years     │
│   > 80 Hz  → 40-50 years     │
│   < 80 Hz  → 50+ years       │
│                              │
│ IF Female (> 180 Hz):        │
│   > 235 Hz → 18-23 years     │
│   > 225 Hz → 20-25 years     │
│   > 215 Hz → 25-30 years     │
│   > 205 Hz → 30-35 years     │
│   > 195 Hz → 35-40 years     │
│   > 185 Hz → 40-50 years     │
│   < 185 Hz → 50+ years       │
└──────┬───────────────────────┘
       │
       ↓
┌──────────────────────────────┐
│ Confidence Calculation       │
│ • High: StdDev < 10          │
│ • Medium: StdDev < 20        │
│ • Low: StdDev >= 20          │
└──────┬───────────────────────┘
       │
       ↓
┌──────────────────────────────┐
│ Display Result               │
│ Age: 25-30 years             │
│ Confidence: High             │
└──────────────────────────────┘
```

---

## 3. Gender Detection Flow

```
┌──────────────────────────────┐
│ Pitch History (50 samples)   │
│ • Already collected          │
│ • Outliers removed           │
│ • Median calculated          │
└──────┬───────────────────────┘
       │
       ↓
┌──────────────────────────────┐
│ Primary Classification       │
│                              │
│ medianPitch < 165 Hz?        │
│        YES ──→ Male          │
│        NO  ──→ Continue      │
│                              │
│ medianPitch > 180 Hz?        │
│        YES ──→ Female        │
│        NO  ──→ Ambiguous     │
└──────┬───────────────────────┘
       │
       ↓
┌──────────────────────────────┐
│ Confidence Scoring (Clear)   │
│                              │
│ Male:                        │
│   < 140 Hz + stable → High   │
│   < 155 Hz → Medium          │
│   < 165 Hz → Low             │
│                              │
│ Female:                      │
│   > 220 Hz + stable → High   │
│   > 200 Hz → Medium          │
│   > 180 Hz → Low             │
└──────┬───────────────────────┘
       │
       ↓
┌──────────────────────────────┐
│ Ambiguous Zone (165-180 Hz)  │
│                              │
│ Step 1: Majority Voting      │
│   maleVotes = count(< 165)   │
│   femaleVotes = count(> 180) │
│                              │
│ Step 2: Vote Comparison      │
│   IF maleVotes > femaleVotes │
│      → Male                  │
│   ELSE IF femaleVotes > male │
│      → Female                │
│   ELSE → Energy Analysis     │
└──────┬───────────────────────┘
       │
       ↓
┌──────────────────────────────┐
│ Energy Ratio Analysis        │
│ (Tie-breaker)                │
│                              │
│ highFreqEnergy = 2-4 kHz     │
│ lowFreqEnergy = 80-500 Hz    │
│ ratio = high / low           │
│                              │
│ IF ratio > 1.2 → Female      │
│ ELSE → Male                  │
│                              │
│ Confidence: Low              │
└──────┬───────────────────────┘
       │
       ↓
┌──────────────────────────────┐
│ Display Result               │
│ Gender: Male                 │
│ Confidence: Medium           │
└──────────────────────────────┘
```

---

## 4. Language Detection Flow

```
┌──────────────────────────────┐
│ Speech Recognition API       │
│ • Transcript: "hello main    │
│   kar raha hoon"             │
└──────┬───────────────────────┘
       │
       ↓
┌──────────────────────────────┐
│ Script Detection (Priority 1)│
│                              │
│ Contains Devanagari          │
│ (U+0900 - U+097F)?           │
│   YES → Hindi ✓              │
│   NO  → Continue             │
│                              │
│ Contains Gurmukhi            │
│ (U+0A00 - U+0A7F)?           │
│   YES → Punjabi ✓            │
│   NO  → Continue             │
└──────┬───────────────────────┘
       │
       ↓
┌──────────────────────────────┐
│ Word Tokenization            │
│ • Split by whitespace        │
│ • Remove punctuation         │
│ • Convert to lowercase       │
│                              │
│ words = ["hello", "main",    │
│          "kar", "raha",      │
│          "hoon"]             │
└──────┬───────────────────────┘
       │
       ↓
┌──────────────────────────────┐
│ Word Matching (Exact)        │
│                              │
│ Hindi Words (70+):           │
│ • main, hoon, kar, raha      │
│ • Match count: 4             │
│                              │
│ English Words (80+):         │
│ • hello, this, the, is       │
│ • Match count: 1             │
│                              │
│ Punjabi Words (35+):         │
│ • tussi, paaji, veere        │
│ • Match count: 0             │
└──────┬───────────────────────┘
       │
       ↓
┌──────────────────────────────┐
│ Percentage Calculation       │
│                              │
│ Total words: 5               │
│ Hindi: 4/5 = 80%             │
│ English: 1/5 = 20%           │
│ Punjabi: 0/5 = 0%            │
└──────┬───────────────────────┘
       │
       ↓
┌──────────────────────────────┐
│ Priority-Based Classification│
│                              │
│ 1. Punjabi count >= 1?       │
│    NO → Continue             │
│                              │
│ 2. Hindi >= 3 OR >= 50%?     │
│    YES → Hindi ✓             │
│                              │
│ 3. English >= 3 (no Hindi)?  │
│    NO → Continue             │
│                              │
│ 4. Both >= 25%?              │
│    YES → Hinglish            │
│                              │
│ 5. Compare counts            │
│    Hindi > English → Hindi   │
└──────┬───────────────────────┘
       │
       ↓
┌──────────────────────────────┐
│ Language Switch Decision     │
│                              │
│ Detected: Hindi              │
│ Current Mode: en-IN          │
│ Optimal Mode: hi-IN          │
│                              │
│ IF mode different:           │
│   • Set 2-sec debounce timer │
│   • After 2 sec: switch mode │
└──────┬───────────────────────┘
       │
       ↓
┌──────────────────────────────┐
│ Display Result               │
│ Language: Hinglish           │
│ (80% Hindi, 20% English)     │
└──────────────────────────────┘
```

---

## 5. Live Transcription Flow

```
┌──────────────────────────────┐
│ START ANALYSIS Button        │
└──────┬───────────────────────┘
       │
       ↓
┌──────────────────────────────┐
│ Initialize Recognition       │
│ • Mode: en-IN (default)      │
│ • continuous: true           │
│ • interimResults: true       │
└──────┬───────────────────────┘
       │
       ↓
┌──────────────────────────────┐
│ User Speaks: "Hello"         │
└──────┬───────────────────────┘
       │
       ↓
┌──────────────────────────────┐
│ Interim Results (Real-time)  │
│ • "h"                        │
│ • "hello"                    │
│ • "hello th"                 │
│ • "hello this"               │
└──────┬───────────────────────┘
       │
       ↓
┌──────────────────────────────┐
│ Final Result                 │
│ transcript: "hello this is   │
│              good"           │
│ isFinal: true                │
└──────┬───────────────────────┘
       │
       ↓
┌──────────────────────────────┐
│ Language Detection           │
│ • Analyze text               │
│ • Result: English (100%)     │
└──────┬───────────────────────┘
       │
       ↓
┌──────────────────────────────┐
│ Mode Check                   │
│ Current: en-IN               │
│ Optimal: en-IN               │
│ Match? YES → No switch       │
└──────┬───────────────────────┘
       │
       ↓
┌──────────────────────────────┐
│ Add to Transcript History    │
│ • "hello this is good"       │
│ • Timestamp: 13:00:52        │
└──────┬───────────────────────┘
       │
       ↓
┌──────────────────────────────┐
│ Display in UI                │
└──────┬───────────────────────┘
       │
       ↓
┌──────────────────────────────┐
│ User Speaks: "main kar raha" │
└──────┬───────────────────────┘
       │
       ↓
┌──────────────────────────────┐
│ Final Result (en-IN mode)    │
│ transcript: "main kar raha   │
│              hoon"           │
└──────┬───────────────────────┘
       │
       ↓
┌──────────────────────────────┐
│ Language Detection           │
│ • Analyze text               │
│ • Result: Hindi (100%)       │
└──────┬───────────────────────┘
       │
       ↓
┌──────────────────────────────┐
│ Mode Check                   │
│ Current: en-IN               │
│ Optimal: hi-IN               │
│ Match? NO → Need switch      │
└──────┬───────────────────────┘
       │
       ↓
┌──────────────────────────────┐
│ Debounce Timer (2 seconds)   │
│ • Clear previous timer       │
│ • Set new timer: 2000ms      │
└──────┬───────────────────────┘
       │
       ↓ (after 2 seconds)
┌──────────────────────────────┐
│ Switch Language Mode         │
│ • Stop recognition           │
│ • Wait 300ms                 │
│ • recognition.lang = "hi-IN" │
│ • Start recognition          │
└──────┬───────────────────────┘
       │
       ↓
┌──────────────────────────────┐
│ Now in hi-IN Mode            │
│ • Next Hindi speech will be  │
│   more accurate              │
└──────────────────────────────┘
```

---

## 6. Data Flow Timeline

```
Time: 0ms
┌─────────────────────────────────────────┐
│ Click "START ANALYSIS"                  │
└─────────────────────────────────────────┘

Time: 100ms
┌─────────────────────────────────────────┐
│ First pitch sample collected            │
│ Pitch: 135 Hz                           │
└─────────────────────────────────────────┘

Time: 200ms
┌─────────────────────────────────────────┐
│ Second pitch sample                     │
│ Pitch: 138 Hz                           │
└─────────────────────────────────────────┘

Time: 2000ms (2 seconds)
┌─────────────────────────────────────────┐
│ 20 samples collected                    │
│ Minimum threshold reached               │
│ First determination possible            │
└─────────────────────────────────────────┘

Time: 2100ms
┌─────────────────────────────────────────┐
│ Gender detected: Male (low confidence)  │
│ Age: 25-30 years (low confidence)       │
└─────────────────────────────────────────┘

Time: 3500ms
┌─────────────────────────────────────────┐
│ User speaks first word: "Hello"         │
│ Speech Recognition activated            │
└─────────────────────────────────────────┘

Time: 3800ms
┌─────────────────────────────────────────┐
│ Interim: "hello"                        │
│ Shown in console (live)                 │
└─────────────────────────────────────────┘

Time: 4500ms
┌─────────────────────────────────────────┐
│ Interim: "hello this is"                │
└─────────────────────────────────────────┘

Time: 5000ms (5 seconds)
┌─────────────────────────────────────────┐
│ 50 samples collected (max)              │
│ Outliers removed, median calculated     │
│ High confidence now available           │
└─────────────────────────────────────────┘

Time: 5100ms
┌─────────────────────────────────────────┐
│ Gender: Male (high confidence)          │
│ Age: 25-30 years (medium confidence)    │
│ Pitch: 135 Hz ±8                        │
└─────────────────────────────────────────┘

Time: 5500ms
┌─────────────────────────────────────────┐
│ Final transcript: "hello this is good"  │
│ Language detected: English (100%)       │
│ Added to transcript history             │
└─────────────────────────────────────────┘

Time: 8000ms
┌─────────────────────────────────────────┐
│ User speaks Hindi: "main kar raha hoon" │
│ Language detected: Hindi (100%)         │
│ Mode switch scheduled (2-sec debounce)  │
└─────────────────────────────────────────┘

Time: 10000ms (10 seconds)
┌─────────────────────────────────────────┐
│ Language mode switched: en-IN → hi-IN   │
│ Recognition restarted                   │
│ Ready for next Hindi utterance          │
└─────────────────────────────────────────┘
```

---

## 7. Accuracy Factors

```
┌─────────────────────────────────────────┐
│           ACCURACY FACTORS              │
└─────────────────────────────────────────┘
                  │
    ┌─────────────┴─────────────┐
    │                           │
┌───▼────┐                 ┌────▼───┐
│ HELPS  │                 │ HURTS  │
└───┬────┘                 └────┬───┘
    │                           │
    ├─ Clear speech             ├─ Background noise
    ├─ Stable voice             ├─ Shouting/whispering
    ├─ 50+ samples              ├─ < 20 samples
    ├─ Good microphone          ├─ Poor mic quality
    ├─ Quiet environment        ├─ Echo/reverb
    ├─ Natural speaking         ├─ Voice disguise
    ├─ Proper distance          ├─ Too far/close
    └─ Chrome browser           └─ Firefox (limited)
```

---

**End of Diagrams**

These visual representations help understand the flow and logic of each detection system.
