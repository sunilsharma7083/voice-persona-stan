import { motion } from "framer-motion";
import { Fingerprint, Activity, UserSearch } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export interface AnalysisData {
  age_range: string;
  gender: "Male" | "Female" | "Unknown";
  confidence: "low" | "medium" | "high";
  traits?: string[];
}

interface AnalysisPanelProps {
  data: AnalysisData | null;
  isLoading?: boolean;
}

export function AnalysisPanel({ data, isLoading }: AnalysisPanelProps) {
  const getConfidenceColor = (conf: string) => {
    switch (conf) {
      case "high": return "bg-green-500 shadow-[0_0_10px_var(--color-green-500)]";
      case "medium": return "bg-yellow-500 shadow-[0_0_10px_var(--color-yellow-500)]";
      case "low": return "bg-red-500 shadow-[0_0_10px_var(--color-red-500)]";
      default: return "bg-gray-500";
    }
  };

  const getConfidencePercent = (conf: string) => {
    switch (conf) {
      case "high": return 92;
      case "medium": return 65;
      case "low": return 30;
      default: return 0;
    }
  };

  return (
    <Card className="glass-card border-white/5 h-full flex flex-col overflow-hidden relative">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5 pointer-events-none" />
      
      <CardHeader className="border-b border-white/5 pb-4">
        <CardTitle className="flex items-center gap-2 text-primary tracking-wider font-mono text-sm uppercase">
          <Activity className="w-4 h-4" />
          Live Inference
        </CardTitle>
      </CardHeader>
      
      <CardContent className="flex-1 p-6 space-y-8 relative">
        {!data ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-4">
            <UserSearch className="w-12 h-12 opacity-20" />
            <p className="font-mono text-xs uppercase tracking-widest opacity-50">Waiting for input...</p>
          </div>
        ) : (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-8"
          >
            {/* Age Analysis */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs font-mono uppercase text-muted-foreground">
                <span>Estimated Age Range</span>
                <span className="text-primary">{data.age_range}</span>
              </div>
              <div className="h-2 bg-secondary rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: "100%" }}
                  className="h-full bg-primary/50 relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent w-full -translate-x-full animate-[shimmer_2s_infinite]" />
                </motion.div>
              </div>
            </div>

            {/* Gender Analysis */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs font-mono uppercase text-muted-foreground">
                <span>Inferred Gender</span>
                <span className="text-accent">{data.gender}</span>
              </div>
               <div className="grid grid-cols-2 gap-1 h-2">
                  <div className={cn(
                    "rounded-l-full transition-all duration-500 border border-white/5",
                    data.gender === "Male" ? "bg-accent shadow-[0_0_10px_var(--color-accent)] opacity-100" : "bg-secondary opacity-30"
                  )} />
                  <div className={cn(
                    "rounded-r-full transition-all duration-500 border border-white/5",
                    data.gender === "Female" ? "bg-accent shadow-[0_0_10px_var(--color-accent)] opacity-100" : "bg-secondary opacity-30"
                  )} />
               </div>
            </div>

            {/* Confidence Meter */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs font-mono uppercase text-muted-foreground">
                <span>Model Confidence</span>
                <span className={cn(
                  "px-2 py-0.5 rounded text-[10px] font-bold border",
                  data.confidence === "high" ? "border-green-500/50 text-green-400 bg-green-500/10" :
                  data.confidence === "medium" ? "border-yellow-500/50 text-yellow-400 bg-yellow-500/10" :
                  "border-red-500/50 text-red-400 bg-red-500/10"
                )}>
                  {data.confidence.toUpperCase()}
                </span>
              </div>
              
              <div className="flex items-end gap-1 h-12">
                {Array.from({ length: 20 }).map((_, i) => {
                  const isActive = (i / 20) * 100 < getConfidencePercent(data.confidence);
                  return (
                    <motion.div
                      key={i}
                      initial={{ height: "20%" }}
                      animate={{ 
                        height: isActive ? `${Math.random() * 40 + 60}%` : "20%",
                        backgroundColor: isActive ? "hsl(var(--primary))" : "hsl(var(--muted))",
                        opacity: isActive ? 1 : 0.2
                      }}
                      transition={{ duration: 0.5 }}
                      className="flex-1 rounded-sm min-h-[4px]"
                    />
                  );
                })}
              </div>
            </div>

            {/* JSON Output Preview */}
            <div className="mt-8 pt-6 border-t border-white/5">
              <p className="text-[10px] font-mono uppercase text-muted-foreground mb-2">Raw Output</p>
              <pre className="bg-black/40 p-3 rounded-lg border border-white/5 text-[10px] font-mono text-primary/80 overflow-x-auto">
                {JSON.stringify(data, null, 2)}
              </pre>
            </div>
            
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
}

// Utility for styles
function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(" ");
}
