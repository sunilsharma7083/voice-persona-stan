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
  const messagesRef = useRef<Message[]>([]);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    synthesisRef.current = window.speechSynthesis;
    
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event: any) => {
        // CRITICAL: If AI is speaking, do not process microphone input
        if (isAiSpeakingRef.current) return;

        const results = event.results;
        const lastResult = results[results.length - 1];
        
        if (lastResult.isFinal) {
          const transcript = lastResult[0].transcript.trim();
          if (transcript.length > 0) {
            // Prevent duplicate processing of the same exact phrase
            const lastMsg = messagesRef.current[messagesRef.current.length - 1];
            if (lastMsg?.role === "user" && lastMsg.text === transcript) return;
            
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
    const auraVoice = voices.find(v => v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Female')) || voices[0];
    if (auraVoice) utterance.voice = auraVoice;
    
    utterance.onstart = () => {
      isAiSpeakingRef.current = true;
    };

    utterance.onend = () => {
      // Small buffer to ensure mic doesn't catch the tail end of the speaker
      setTimeout(() => {
        isAiSpeakingRef.current = false;
      }, 500);
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
    
    // Simulate thinking with a bit of randomness for realism
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
    }, 1200);
  };

  const generateAIResponse = (input: string): { text: string; analysis: AnalysisData } => {
    const lowerInput = input.toLowerCase();
    
    let age = analysis?.age_range || "Unknown";
    let gender: "Male" | "Female" | "Unknown" = analysis?.gender || "Unknown";
    let confidence: "low" | "medium" | "high" = analysis?.confidence || "low";

    // Dynamic Inference Logic Improvements
    if (lowerInput.match(/\b(bro|dude|man|guy|him|father|son)\b/)) {
      gender = "Male";
      confidence = "high";
    } else if (lowerInput.match(/\b(girl|her|she|woman|lady|mother|daughter)\b/)) {
      gender = "Female";
      confidence = "high";
    }

    if (lowerInput.match(/\b(school|game|homework|fun|play)\b/)) {
      age = "12-18";
      confidence = "medium";
    } else if (lowerInput.match(/\b(career|mortgage|taxes|investment|meeting)\b/)) {
      age = "30-50";
      confidence = "high";
    }

    // Varied Human-like responses based on keywords
    if (lowerInput.includes("how are you")) {
      return {
        text: "I'm doing great! Just processing data and enjoying our chat. How are things on your side?",
        analysis: { age_range: age, gender, confidence }
      };
    }

    if (lowerInput.includes("hello") || lowerInput.includes("hi")) {
      return {
        text: "Hello! It's lovely to meet you. I'm ready to chat whenever you are. What's up?",
        analysis: { age_range: age, gender, confidence }
      };
    }

    if (lowerInput.includes("where are you")) {
      return {
        text: "I'm right here in your browser, powered by code and a bit of AI magic. No physical address, but I'm quite comfortable here!",
        analysis: { age_range: age, gender, confidence }
      };
    }

    if (lowerInput.includes("name")) {
      return {
        text: "I'm Aura, your voice-analyzing companion. And you? I'd love to learn more about you through our conversation.",
        analysis: { age_range: age, gender, confidence }
      };
    }

    // Diverse fallback responses to avoid repetition
    const reactions = [
      "I hear you. That's a perspective I haven't fully explored yet. Can you tell me more?",
      "Interesting! I'm noticing some unique characteristics in how you express that. What else is on your mind?",
      "I see. It sounds like you've put some thought into this. I'm listening intently.",
      "Got it. That's a really clear point. How does that typically affect your day?",
      "That makes sense to me. I'm updating my profile of our interaction as we speak. Anything else you want to share?",
      "Wow, that's something worth diving into. I'm here to listen if you want to expand on that."
    ];
    
    return {
      text: reactions[Math.floor(Math.random() * reactions.length)],
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
      const greeting = "Aura is online. Speak naturally, I'm listening.";
      setMessages([{
        id: "start",
        role: "ai",
        text: greeting,
        timestamp: new Date()
      }]);
      speak(greeting);
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
              <h1 className="text-xl font-display font-bold tracking-tight text-glow">Aura Intelligence</h1>
              <p className="text-xs text-muted-foreground font-mono">Conversational Analysis Module v2.6</p>
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
                {isActive ? "System Active" : "Standby"}
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
                     <><MicOff className="w-4 h-4 mr-2" /> Stop Talking</>
                   ) : (
                     <><Mic className="w-4 h-4 mr-2" /> Start Talking</>
                   )}
                 </Button>
                 <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-tighter opacity-50 text-center">
                   {isActive ? "I am analyzing and responding in real-time" : "Activate voice to begin natural interaction"}
                 </p>
               </div>
            </div>

            <div className="flex-1 glass-card rounded-xl p-6 min-h-0 flex flex-col">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xs font-mono uppercase text-muted-foreground flex items-center gap-2">
                  <Sparkles className="w-3 h-3 text-primary" /> Conversation Logs
                </h2>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setMessages([])}
                  className="h-6 px-2 text-[10px] font-mono uppercase opacity-50 hover:opacity-100"
                >
                  Reset History
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
