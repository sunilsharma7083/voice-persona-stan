// Simple AI response generator (mock for now - can connect to real AI later)

export interface AIResponse {
  text: string;
  language: 'en' | 'hi' | 'mixed';
}

const responses: Record<string, string[]> = {
  gender: [
    "Gender detection based on pitch frequency.",
    "Voice pitch indicates gender characteristics."
  ],
  age: [
    "Age estimated from voice patterns.",
    "Speech characteristics show age indicators."
  ],
  how: [
    "Analyzing pitch, frequency, and energy levels.",
    "Voice analysis uses audio signal processing."
  ],
  accuracy: [
    "Accuracy depends on voice clarity.",
    "Longer speech gives better results."
  ],
  test: [
    "Voice detected. Analyzing.",
    "Analysis running."
  ],
  help: [
    "Ask about voice analysis or detection.",
    "Available: gender, age, pitch analysis."
  ],
  default: [
    "Understood.",
    "Analyzing voice.",
    "Received."
  ]
};

export function generateAIResponse(userText: string): AIResponse {
  const lowerText = userText.toLowerCase();
  
  // Detect language
  const hasHindi = /[आ-ह]/.test(userText);
  const language: 'en' | 'hi' | 'mixed' = hasHindi ? 'mixed' : 'en';
  
  // Match keywords - Q&A focused
  let responseArray = responses.default;
  
  if (lowerText.includes('gender') || lowerText.includes('male') || lowerText.includes('female') || 
      lowerText.includes('ladka') || lowerText.includes('ladki')) {
    responseArray = responses.gender;
  } else if (lowerText.includes('age') || lowerText.includes('umar') || lowerText.includes('kitna')) {
    responseArray = responses.age;
  } else if (lowerText.includes('how') || lowerText.includes('kaise') || lowerText.includes('work')) {
    responseArray = responses.how;
  } else if (lowerText.includes('accurate') || lowerText.includes('correct') || lowerText.includes('sahi')) {
    responseArray = responses.accuracy;
  } else if (lowerText.includes('test') || lowerText.includes('testing') || lowerText.includes('check')) {
    responseArray = responses.test;
  } else if (lowerText.includes('help') || lowerText.includes('madad')) {
    responseArray = responses.help;
  }
  
  // Random selection
  const text = responseArray[Math.floor(Math.random() * responseArray.length)];
  
  return { text, language };
}

// Text-to-Speech utility using Web Speech API
export class TTSEngine {
  private synth: SpeechSynthesis;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  
  constructor() {
    this.synth = window.speechSynthesis;
  }
  
  speak(text: string, options: {
    rate?: number;
    pitch?: number;
    volume?: number;
    lang?: string;
    voice?: string;
  } = {}): Promise<void> {
    return new Promise((resolve, reject) => {
      // Cancel any ongoing speech
      this.stop();
      
      const utterance = new SpeechSynthesisUtterance(text);
      this.currentUtterance = utterance;
      
      // Set options
      utterance.rate = options.rate ?? 1.0;
      utterance.pitch = options.pitch ?? 1.0;
      utterance.volume = options.volume ?? 1.0;
      utterance.lang = options.lang ?? 'en-US';
      
      // Get voices
      const voices = this.synth.getVoices();
      
      // Try to find requested voice or best match
      if (options.voice) {
        const voice = voices.find(v => v.name.includes(options.voice!));
        if (voice) utterance.voice = voice;
      } else {
        // Auto-select best voice based on language
        let voice;
        if (utterance.lang.includes('hi')) {
          voice = voices.find(v => v.lang.includes('hi-IN'));
        } else {
          voice = voices.find(v => 
            (v.lang.includes('en-US') || v.lang.includes('en-GB')) && 
            v.name.includes('Female')
          );
        }
        if (voice) utterance.voice = voice;
      }
      
      utterance.onend = () => {
        this.currentUtterance = null;
        resolve();
      };
      
      utterance.onerror = (event) => {
        this.currentUtterance = null;
        reject(event);
      };
      
      this.synth.speak(utterance);
    });
  }
  
  stop() {
    if (this.synth.speaking) {
      this.synth.cancel();
    }
    this.currentUtterance = null;
  }
  
  pause() {
    if (this.synth.speaking) {
      this.synth.pause();
    }
  }
  
  resume() {
    if (this.synth.paused) {
      this.synth.resume();
    }
  }
  
  getAvailableVoices() {
    return this.synth.getVoices();
  }
  
  isSpeaking() {
    return this.synth.speaking;
  }
}
