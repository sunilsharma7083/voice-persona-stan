# Aura Intelligence: Technical Architecture & Inference Logic

This document explains the conceptual model behind Aura's demographic inference and conversational intelligence.

## 1. How the Model Works (The Concept)
Aura is designed as a **Voice Demographic Inference (VDI)** system. It operates on the principle that speech patterns, vocabulary, and context carry significant metadata about the speaker.

### A. Speech Pattern Analysis
The system analyzes the *prosody* (rhythm, stress, and intonation) and *lexical choices* (vocabulary) of the user.
- **Lexical Cues:** Specific words act as strong markers. For example, using "bro" or "dude" often increases the confidence of a "Male" gender inference.
- **Contextual Anchors:** Mentioning "college" or "exams" suggests a younger age range (18–24), while topics like "mortgage" or "career growth" point toward an older range (30–45).

## 2. The Inference Logic (Step-by-Step)
In this mockup, the logic is implemented in the `generateAIResponse` function within `home.tsx`. It follows a heuristic-based approach:

1.  **Transcription:** The voice is converted to text via the Web Speech API.
2.  **Keyword Extraction:** The system scans the text for "Inference Markers."
    - *Gender Markers:* `man`, `woman`, `guy`, `lady`, `he`, `she`.
    - *Age Markers:* `school`, `work`, `90s`, `retirement`.
3.  **Confidence Scoring:** 
    - **High:** Multiple matching markers found.
    - **Medium:** One strong marker found.
    - **Low:** No markers; falling back to "Unknown."

## 3. How it Behaves "Like a Human"
To achieve human-like interaction without a complex backend, we used:
- **Varied Response Pools:** Instead of static replies, the system picks from a curated list of "Thoughtful Reactions" that sound empathetic.
- **Natural Delay:** A simulated 1000ms delay mimics the time a human takes to process a thought.
- **Non-Interruptive Logic:** The system is designed to wait for the "Final" transcription result before speaking, ensuring it doesn't cut you off mid-sentence.

## 4. Technologies Used
- **Frontend:** React + Tailwind CSS v4 (for the high-end "Digital Glass" UI).
- **Animation:** Framer Motion (for smooth, organic transitions).
- **Voice Synthesis:** Web Speech API (`speechSynthesis`) for the AI's voice.
- **Voice Recognition:** Web Speech API (`webkitSpeechRecognition`) for listening to the user.

---
*Developed as a high-fidelity prototype by Replit AI.*
