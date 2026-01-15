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

  useEffect(() => {
    synthesisRef.current = window.speechSynthesis;
    
    // Initialize Web Speech API for Recognition
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0])
          .map((result: any) => result.transcript)
          .join('');

        if (event.results[event.results.length - 1].isFinal) {
          handleUserSpeech(transcript);
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
  }, []);

  const speak = (text: string) => {
    if (isMuted || !synthesisRef.current) return;
    synthesisRef.current.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.1;
    utterance.pitch = 1.0;
    const voices = synthesisRef.current.getVoices();
    const auraVoice = voices.find(v => v.name.includes('Google') || v.name.includes('Female')) || voices[0];
    if (auraVoice) utterance.voice = auraVoice;
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
    
    // Simple AI Logic to respond like a human
    setIsTyping(true);
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
    }, 1500);
  };

  const generateAIResponse = (input: string): { text: string; analysis: AnalysisData } => {
    const lowerInput = input.toLowerCase();
    
    // Inference Logic based on speech patterns
    let age = "Unknown";
    let gender: "Male" | "Female" | "Unknown" = "Unknown";
    let confidence: "low" | "medium" | "high" = "low";

    if (lowerInput.includes("brother") || lowerInput.includes("gaming") || lowerInput.includes("guy")) {
      age = "25-35";
      gender = "Male";
      confidence = "high";
    } else if (lowerInput.includes("hello") || lowerInput.includes("hi")) {
       confidence = "low";
    }

    const responses = [
      "That's interesting! Tell me more about that.",
      "I hear you. It sounds like you're passionate about this.",
      "I'm analyzing your speech patterns right now. You sound very articulate.",
      "Got it. How does that make you feel?",
      "Interesting perspective. I'm updating my inference model as we speak."
    ];
    
    return {
      text: responses[Math.floor(Math.random() * responses.length)],
      analysis: { age_range: age, gender, confidence }
    };
  };

  const toggleSession = () => {
    if (isActive) {
      recognitionRef.current?.stop();
      setIsActive(false);
    } else {
      setMessages([{
        id: "start",
        role: "ai",
        text: "System active. I'm listening. Speak naturally.",
        timestamp: new Date()
      }]);
      recognitionRef.current?.start();
      setIsActive(true);
      speak("System active. I'm listening. Speak naturally.");
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
              <h1 className="text-xl font-display font-bold tracking-tight">Aura Interface</h1>
              <p className="text-xs text-muted-foreground font-mono">Real-Time Voice Analysis Module</p>
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
                {isActive ? "System Listening" : "Standby"}
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
                     <><MicOff className="w-4 h-4 mr-2" /> Stop Listening</>
                   ) : (
                     <><Mic className="w-4 h-4 mr-2" /> Start Live Conversation</>
                   )}
                 </Button>
                 <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-tighter opacity-50">
                   {isActive ? "AI is processing your voice in real-time" : "Click to activate voice capture"}
                 </p>
               </div>
            </div>

            <div className="flex-1 glass-card rounded-xl p-6 min-h-0 flex flex-col">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xs font-mono uppercase text-muted-foreground flex items-center gap-2">
                  <Sparkles className="w-3 h-3 text-primary" /> Live Conversation Transcript
                </h2>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setMessages([])}
                  className="h-6 px-2 text-[10px] font-mono uppercase opacity-50 hover:opacity-100"
                >
                  Clear Logs
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
