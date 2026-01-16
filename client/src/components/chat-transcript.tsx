import { motion, AnimatePresence } from "framer-motion";
import { User, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export interface Message {
  id: string;
  role: "user" | "ai";
  text: string;
  timestamp: Date;
}

interface ChatTranscriptProps {
  messages: Message[];
  isTyping?: boolean;
}

export function ChatTranscript({ messages, isTyping }: ChatTranscriptProps) {
  // Show all messages now (both user and AI for full conversation)
  
  return (
    <div className="flex flex-col space-y-4 h-full overflow-y-auto pr-2 scrollbar-hide">
      <AnimatePresence initial={false}>
        {messages.map((msg) => (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
              "flex w-full gap-3",
              msg.role === "user" ? "justify-end" : "justify-start"
            )}
          >
            {msg.role === "ai" && (
              <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                <Sparkles className="w-4 h-4 text-primary" />
              </div>
            )}
            
            <div
              className={cn(
                "max-w-[75%] p-3 rounded-2xl backdrop-blur-sm border text-sm",
                msg.role === "user" 
                  ? "bg-accent/10 border-accent/20 text-accent-foreground rounded-br-none" 
                  : "bg-primary/5 border-primary/20 text-foreground rounded-bl-none"
              )}
            >
              <p className="leading-relaxed">{msg.text}</p>
              <span className="text-[10px] opacity-40 mt-1 block font-mono">
                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>

            {msg.role === "user" && (
               <div className="w-8 h-8 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center shrink-0">
                <User className="w-4 h-4 text-accent" />
              </div>
            )}
          </motion.div>
        ))}
        
        {isTyping && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex w-full gap-3 justify-start"
          >
             <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                <Sparkles className="w-4 h-4 text-primary" />
              </div>
              <div className="bg-primary/5 border border-primary/20 p-3 rounded-2xl rounded-bl-none flex gap-1 items-center">
                <span className="w-1.5 h-1.5 bg-primary/50 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                <span className="w-1.5 h-1.5 bg-primary/50 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                <span className="w-1.5 h-1.5 bg-primary/50 rounded-full animate-bounce"></span>
              </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
