import { useState, useEffect, useRef } from "react";
import { Mic, MicOff, RefreshCw, Play, Volume2, VolumeX, Sparkles } from "lucide-react";
import { AudioVisualizer } from "@/components/audio-visualizer";
import { ChatTranscript, Message } from "@/components/chat-transcript";
import { AnalysisPanel, AnalysisData } from "@/components/analysis-panel";
import { Button } from "@/components/ui/button";
import generatedImage from '@assets/generated_images/futuristic_ai_data_background.png';

export default function Home() {
  const [isActive, setIsActive] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [analysis, setAnalysis] = useState<AnalysisData | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  
  const synthesisRef = useRef<SpeechSynthesis | null>(null);
  const recognitionRef = useRef<any>(null);
  const isAiSpeakingRef = useRef(false);

  useEffect(() => {
    synthesisRef.current = window.speechSynthesis;
    
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event: any) => {
        if (isAiSpeakingRef.current) return;

        const results = event.results;
        const lastResult = results[results.length - 1];
        
        if (lastResult.isFinal) {
          const transcript = lastResult[0].transcript.trim();
          if (transcript.length > 0) {
            handleUserSpeech(transcript);
          }
        }
      };

      recognitionRef.current.onend = () => {
        if (isActive) {
          recognitionRef.current.start();
        }
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error);
        if (event.error === 'not-allowed') {
          setIsActive(false);
        }
      };
    }

    return () => {
      synthesisRef.current?.cancel();
      recognitionRef.current?.stop();
    };
  }, [isActive]);

  const speak = (text: string) => {
    if (isMuted || !synthesisRef.current) return;
    
    synthesisRef.current.cancel();
    isAiSpeakingRef.current = true;
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    
    const voices = synthesisRef.current.getVoices();
    // Prefer more natural sounding voices
    const auraVoice = voices.find(v => v.name.includes('Premium') || v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Female')) || voices[0];
    if (auraVoice) utterance.voice = auraVoice;
    
    utterance.onend = () => {
      isAiSpeakingRef.current = false;
    };

    utterance.onerror = () => {
      isAiSpeakingRef.current = false;
    };

    synthesisRef.current.speak(utterance);
  };

  const handleUserSpeech = (text: string) => {
    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      text: text,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMsg]);
    
    setIsTyping(true);
    
    // Simulate thinking time
    setTimeout(() => {
      const response = generateAIResponse(text);
      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "ai",
        text: response.text,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiMsg]);
      setAnalysis(response.analysis);
      setIsTyping(false);
      speak(response.text);
    }, 1000);
  };

  const generateAIResponse = (input: string): { text: string; analysis: AnalysisData } => {
    const lowerInput = input.toLowerCase();
    
    let age = analysis?.age_range || "Unknown";
    let gender: "Male" | "Female" | "Unknown" = analysis?.gender || "Unknown";
    let confidence: "low" | "medium" | "high" = analysis?.confidence || "low";

    // Dynamic Inference Logic
    if (lowerInput.match(/\b(bro|man|guy|dude|boy)\b/)) {
      gender = "Male";
      confidence = "high";
    } else if (lowerInput.match(/\b(girl|woman|lady|she|her)\b/)) {
      gender = "Female";
      confidence = "high";
    }

    if (lowerInput.match(/\b(college|university|student|study)\b/)) {
      age = "18-24";
      confidence = "medium";
    } else if (lowerInput.match(/\b(work|office|job|boss|career)\b/)) {
      age = "25-40";
      confidence = "high";
    }

    // Contextual Conversation Logic
    if (lowerInput.includes("how are you")) {
      return {
        text: "I'm doing great, thank you for asking! I'm enjoying our conversation. How about you? How is your day going?",
        analysis: { age_range: age, gender, confidence }
      };
    }

    if (lowerInput.includes("where are you from")) {
      return {
        text: "I exist in the digital realm, but I was designed to be your conversational companion. I don't have a physical hometown, but I'm right here with you now!",
        analysis: { age_range: age, gender, confidence }
      };
    }

    if (lowerInput.includes("hello") || lowerInput.includes("hi")) {
      return {
        text: "Hey there! It's good to hear from you. What's on your mind today?",
        analysis: { age_range: age, gender, confidence }
      };
    }

    if (lowerInput.includes("name")) {
       return {
        text: "My name is Aura. I'm an AI designed to analyze and converse. What should I call you?",
        analysis: { age_range: age, gender, confidence }
      };
    }

    // Default intelligent responses
    const thoughtfulResponses = [
      "That's a really interesting point. It makes me think about how we perceive things differently. Can you elaborate on that?",
      "I see what you're saying. It's fascinating how those details connect. What led you to that thought?",
      "I appreciate you sharing that. It adds a lot of context to our conversation. What else should I know?",
      "That makes total sense. I'm actually picking up on some interesting patterns in how you describe that. Tell me more.",
      "I'm following you. It sounds like this is something you've thought about quite a bit. What's the most important part of it for you?"
    ];
    
    return {
      text: thoughtfulResponses[Math.floor(Math.random() * thoughtfulResponses.length)],
      analysis: { age_range: age, gender, confidence }
    };
  };

  const toggleSession = () => {
    if (isActive) {
      recognitionRef.current?.stop();
      synthesisRef.current?.cancel();
      isAiSpeakingRef.current = false;
      setIsActive(false);
    } else {
      setMessages([]);
      recognitionRef.current?.start();
      setIsActive(true);
      const intro = "System online. I'm ready to talk. What's on your mind?";
      setMessages([{
        id: "start",
        role: "ai",
        text: intro,
        timestamp: new Date()
      }]);
      speak(intro);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary/20 relative overflow-hidden">
      <div 
        className="absolute inset-0 z-0 opacity-20 pointer-events-none"
        style={{
          backgroundImage: `url(${generatedImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'blur(2px) saturate(0.5)'
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background/80 z-0 pointer-events-none" />

      <div className="relative z-10 container mx-auto p-4 h-screen flex flex-col gap-4">
        
        <header className="flex justify-between items-center py-4 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-primary flex items-center justify-center text-background font-bold font-mono">
              A
            </div>
            <div>
              <h1 className="text-xl font-display font-bold tracking-tight text-glow">Aura Interface</h1>
              <p className="text-xs text-muted-foreground font-mono">Conversational Intelligence v2.5</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMuted(!isMuted)}
              className="text-muted-foreground hover:text-primary transition-colors"
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </Button>
            <div className="flex items-center gap-2 border-l border-white/10 pl-4">
              <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-red-500 animate-pulse shadow-[0_0_10px_var(--color-red-500)]' : 'bg-muted'}`} />
              <span className="text-xs font-mono uppercase text-muted-foreground">
                {isActive ? "Active Session" : "Standby"}
              </span>
            </div>
          </div>
        </header>

        <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-4 min-h-0">
          
          <div className="md:col-span-8 flex flex-col gap-4 h-full min-h-0">
            <div className="glass-card rounded-xl p-6 flex flex-col items-center justify-center min-h-[160px] relative overflow-hidden">
               <div className="absolute inset-0 bg-grid-white/[0.02] -z-10" />
               <AudioVisualizer isActive={isActive} />
               <div className="mt-6 flex flex-col items-center gap-3">
                 <Button 
                    onClick={toggleSession}
                    className={cn(
                      "rounded-full px-12 font-mono uppercase tracking-widest text-xs h-12 transition-all duration-500",
                      isActive 
                        ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" 
                        : "bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_0_20px_var(--color-primary)] shadow-primary/20"
                    )}
                 >
                   {isActive ? (
                     <><MicOff className="w-4 h-4 mr-2" /> End Session</>
                   ) : (
                     <><Mic className="w-4 h-4 mr-2" /> Start Conversation</>
                   )}
                 </Button>
                 <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-tighter opacity-50 text-center max-w-xs">
                   {isActive ? "Speak naturally. Aura is responding to your intent." : "Engage in a human-like conversation with the AI"}
                 </p>
               </div>
            </div>

            <div className="flex-1 glass-card rounded-xl p-6 min-h-0 flex flex-col">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xs font-mono uppercase text-muted-foreground flex items-center gap-2">
                  <Sparkles className="w-3 h-3 text-primary" /> Live Interaction Transcript
                </h2>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setMessages([])}
                  className="h-6 px-2 text-[10px] font-mono uppercase opacity-50 hover:opacity-100"
                >
                  Clear History
                </Button>
              </div>
              <ChatTranscript messages={messages} isTyping={isTyping} />
            </div>
          </div>

          <div className="md:col-span-4 h-full min-h-0">
            <AnalysisPanel data={analysis} />
          </div>

        </div>
      </div>
    </div>
  );
}

function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(" ");
}
