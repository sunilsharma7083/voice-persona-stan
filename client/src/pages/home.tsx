import { useState, useEffect, useRef } from "react";
import { Mic, MicOff, RefreshCw, Play, Volume2, VolumeX } from "lucide-react";
import { AudioVisualizer } from "@/components/audio-visualizer";
import { ChatTranscript, Message } from "@/components/chat-transcript";
import { AnalysisPanel, AnalysisData } from "@/components/analysis-panel";
import { Button } from "@/components/ui/button";
import { MOCK_CONVERSATION } from "@/lib/mock-data";
import generatedImage from '@assets/generated_images/futuristic_ai_data_background.png';

export default function Home() {
  const [isActive, setIsActive] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [analysis, setAnalysis] = useState<AnalysisData | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [simIndex, setSimIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  
  const synthesisRef = useRef<SpeechSynthesis | null>(null);

  useEffect(() => {
    synthesisRef.current = window.speechSynthesis;
    return () => {
      synthesisRef.current?.cancel();
    };
  }, []);

  const speak = (text: string) => {
    if (isMuted || !synthesisRef.current) return;
    synthesisRef.current.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.1;
    utterance.pitch = 1.0;
    // Find a good female voice if possible
    const voices = synthesisRef.current.getVoices();
    const auraVoice = voices.find(v => v.name.includes('Google') || v.name.includes('Female')) || voices[0];
    if (auraVoice) utterance.voice = auraVoice;
    synthesisRef.current.speak(utterance);
  };

  const startSimulation = () => {
    setIsActive(true);
    setMessages([]);
    setAnalysis(null);
    setSimIndex(0);
  };

  const stopSimulation = () => {
    setIsActive(false);
    setIsTyping(false);
    setSimIndex(999);
    synthesisRef.current?.cancel();
  };

  useEffect(() => {
    if (!isActive || simIndex >= MOCK_CONVERSATION.length) return;

    const step = MOCK_CONVERSATION[simIndex];
    
    const timer = setTimeout(() => {
      if (step.typing !== undefined) setIsTyping(step.typing);
      
      if (step.message) {
        setMessages(prev => [...prev, step.message!]);
        if (step.message.role === "ai") {
          speak(step.message.text);
        }
      }
      
      if (step.analysis) setAnalysis(step.analysis);
      
      setSimIndex(prev => prev + 1);
      
      if (simIndex === MOCK_CONVERSATION.length - 1) {
        setIsActive(false);
      }
    }, step.delay - (simIndex > 0 ? MOCK_CONVERSATION[simIndex-1].delay : 0));

    return () => clearTimeout(timer);
  }, [isActive, simIndex, isMuted]);


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
              <p className="text-xs text-muted-foreground font-mono">Voice Analysis Module v2.4</p>
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
              <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-red-500 animate-pulse' : 'bg-muted'}`} />
              <span className="text-xs font-mono uppercase text-muted-foreground">
                {isActive ? "Live Recording" : "Standby"}
              </span>
            </div>
          </div>
        </header>

        <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-4 min-h-0">
          
          <div className="md:col-span-8 flex flex-col gap-4 h-full min-h-0">
            <div className="glass-card rounded-xl p-6 flex flex-col items-center justify-center min-h-[160px] relative overflow-hidden">
               <div className="absolute inset-0 bg-grid-white/[0.02] -z-10" />
               <AudioVisualizer isActive={isActive} />
               <div className="mt-4 flex gap-4">
                 {!isActive ? (
                   <Button 
                    onClick={startSimulation}
                    className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full px-8 font-mono uppercase tracking-widest text-xs h-10 shadow-[0_0_20px_var(--color-primary)] shadow-primary/20"
                   >
                     <Play className="w-3 h-3 mr-2" /> Start Voice Conversation
                   </Button>
                 ) : (
                   <Button 
                    variant="destructive"
                    onClick={stopSimulation}
                    className="rounded-full px-8 font-mono uppercase tracking-widest text-xs h-10"
                   >
                     <MicOff className="w-3 h-3 mr-2" /> End Session
                   </Button>
                 )}
                 <Button 
                  variant="outline" 
                  size="icon"
                  onClick={() => { stopSimulation(); setMessages([]); setAnalysis(null); }}
                  className="rounded-full border-white/10 hover:bg-white/5"
                 >
                   <RefreshCw className="w-4 h-4" />
                 </Button>
               </div>
            </div>

            <div className="flex-1 glass-card rounded-xl p-6 min-h-0 flex flex-col">
              <h2 className="text-xs font-mono uppercase text-muted-foreground mb-4 flex items-center gap-2">
                <Mic className="w-3 h-3" /> Live Conversation Transcript
              </h2>
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
