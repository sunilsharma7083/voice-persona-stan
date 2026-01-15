import { motion } from "framer-motion";
import { useEffect, useState } from "react";

interface AudioVisualizerProps {
  isActive: boolean;
}

export function AudioVisualizer({ isActive }: AudioVisualizerProps) {
  const [bars, setBars] = useState<number[]>(new Array(32).fill(10));

  useEffect(() => {
    if (!isActive) {
      setBars(new Array(32).fill(5));
      return;
    }

    const interval = setInterval(() => {
      setBars(prev => prev.map(() => Math.random() * 40 + 10));
    }, 100);

    return () => clearInterval(interval);
  }, [isActive]);

  return (
    <div className="flex items-center justify-center gap-[2px] h-20 w-full overflow-hidden mask-linear-fade">
      {bars.map((height, i) => (
        <motion.div
          key={i}
          className="w-1.5 bg-primary/80 rounded-full"
          animate={{ height: isActive ? height : 5 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          style={{
            boxShadow: isActive ? "0 0 8px var(--color-primary)" : "none",
            opacity: isActive ? 1 : 0.3
          }}
        />
      ))}
    </div>
  );
}
