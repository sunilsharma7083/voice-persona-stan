import { useState, useEffect, useRef } from "react";
import { Mic, MicOff, RefreshCw, Play } from "lucide-react";
import { AudioVisualizer } from "@/components/audio-visualizer";
import { AnalysisPanel, AnalysisData } from "@/components/analysis-panel";
import { Button } from "@/components/ui/button";
import { MOCK_CONVERSATION } from "@/lib/mock-data";
import generatedImage from '@assets/generated_images/futuristic_ai_data_background.png';

export default function Home() {
  const [isActive, setIsActive] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisData | null>(null);
  const [useDemo, setUseDemo] = useState(false);
  const [simIndex, setSimIndex] = useState(0);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const pitchHistoryRef = useRef<number[]>([]);
  const analysisIntervalRef = useRef<number | null>(null);

  // Simple but effective real-time voice analysis
  const analyzeVoiceContinuously = () => {
    if (!analyserRef.current || !audioContextRef.current) return;

    const analyser = analyserRef.current;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    const frequencyData = new Float32Array(bufferLength);
    
    analyser.getByteTimeDomainData(dataArray);
    analyser.getFloatFrequencyData(frequencyData);

    // Calculate RMS (volume) to detect if person is speaking
    let sum = 0;
    for (let i = 0; i < bufferLength; i++) {
      const normalized = (dataArray[i] - 128) / 128;
      sum += normalized * normalized;
    }
    const rms = Math.sqrt(sum / bufferLength);
    
    // Only analyze if someone is speaking (above threshold)
    if (rms < 0.01) return; // Silence threshold

    // Detect pitch using autocorrelation
    const sampleRate = audioContextRef.current.sampleRate;
    const pitch = autoCorrelate(dataArray, sampleRate);
    
    if (pitch > 0 && pitch < 500) {
      pitchHistoryRef.current.push(pitch);
      // Keep only last 30 samples for better accuracy
      if (pitchHistoryRef.current.length > 30) {
        pitchHistoryRef.current.shift();
      }
    }

    // Need enough samples before making determination
    if (pitchHistoryRef.current.length < 10) return;

    // Use median pitch (more robust than average)
    const sortedPitches = [...pitchHistoryRef.current].sort((a, b) => a - b);
    const medianPitch = sortedPitches[Math.floor(sortedPitches.length / 2)];
    
    // Calculate average for stability
    const avgPitch = pitchHistoryRef.current.reduce((a, b) => a + b, 0) / pitchHistoryRef.current.length;

    // SIMPLE DECISION BASED ON PITCH
    // Male voices: 85-180 Hz (average ~120 Hz)
    // Female voices: 165-255 Hz (average ~210 Hz)
    
    let detectedGender: "Male" | "Female" | "Unknown" = "Unknown";
    let confidence: "low" | "medium" | "high" = "low";

    if (medianPitch < 150) {
      // Clearly male range
      detectedGender = "Male";
      confidence = medianPitch < 130 ? "high" : "medium";
    } else if (medianPitch >= 150 && medianPitch < 170) {
      // Borderline - check consistency
      const maleCount = pitchHistoryRef.current.filter(p => p < 160).length;
      const femaleCount = pitchHistoryRef.current.filter(p => p >= 170).length;
      
      if (maleCount > femaleCount) {
        detectedGender = "Male";
        confidence = "medium";
      } else {
        detectedGender = "Female";
        confidence = "medium";
      }
    } else if (medianPitch >= 170 && medianPitch < 200) {
      // Female range but check for deep female voice
      detectedGender = "Female";
      confidence = "medium";
    } else {
      // Clearly female range
      detectedGender = "Female";
      confidence = medianPitch > 220 ? "high" : "medium";
    }

    // Additional check: look at energy distribution
    let lowFreqEnergy = 0;
    let highFreqEnergy = 0;
    const splitPoint = Math.floor(frequencyData.length * 0.2);
    
    for (let i = 0; i < splitPoint; i++) {
      lowFreqEnergy += frequencyData[i];
    }
    for (let i = splitPoint; i < frequencyData.length / 2; i++) {
      highFreqEnergy += frequencyData[i];
    }
    
    const energyRatio = lowFreqEnergy / (highFreqEnergy + 1);
    
    // Male voices have more low frequency energy
    if (energyRatio > 1.5 && medianPitch < 170) {
      detectedGender = "Male";
      if (confidence === "low") confidence = "medium";
    } else if (energyRatio < 0.8 && medianPitch > 170) {
      detectedGender = "Female";
      if (confidence === "low") confidence = "medium";
    }

    // Estimate age based on voice characteristics
    let ageRange = "25-35";
    
    if (medianPitch > 250) {
      ageRange = "18-25";
    } else if (medianPitch > 200) {
      ageRange = detectedGender === "Female" ? "25-35" : "18-25";
    } else if (medianPitch > 150) {
      ageRange = "25-40";
    } else if (medianPitch > 120) {
      ageRange = "30-45";
    } else {
      ageRange = "40-60";
    }

    console.log(`🎤 Pitch: ${medianPitch.toFixed(1)}Hz → ${detectedGender} (${confidence})`);

    setAnalysis({
      gender: detectedGender,
      age: ageRange,
      confidence,
      pitch: Math.round(medianPitch),
      energy: rms
    });
  };

  // Autocorrelation function for pitch detection
  const autoCorrelate = (buffer: Uint8Array, sampleRate: number): number => {
    const SIZE = buffer.length;
    const MAX_SAMPLES = Math.floor(SIZE / 2);
    let best_offset = -1;
    let best_correlation = 0;
    let rms = 0;

    // Convert to normalized values
    const normalized = new Float32Array(SIZE);
    for (let i = 0; i < SIZE; i++) {
      const val = (buffer[i] - 128) / 128;
      normalized[i] = val;
      rms += val * val;
    }
    rms = Math.sqrt(rms / SIZE);
    
    if (rms < 0.01) return -1; // Signal too quiet

    // Find the best correlation
    let lastCorrelation = 1;
    for (let offset = 1; offset < MAX_SAMPLES; offset++) {
      let correlation = 0;
      for (let i = 0; i < MAX_SAMPLES; i++) {
        correlation += Math.abs(normalized[i] - normalized[i + offset]);
      }
      correlation = 1 - (correlation / MAX_SAMPLES);
      
      if (correlation > 0.9 && correlation > lastCorrelation) {
        const foundGoodCorrelation = correlation > best_correlation;
        if (foundGoodCorrelation) {
          best_correlation = correlation;
          best_offset = offset;
        }
      }
      lastCorrelation = correlation;
    }

    if (best_offset === -1) return -1;
    
    return sampleRate / best_offset;
  };

  const startRealRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: false
        } 
      });
      streamRef.current = stream;
      
      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;
      
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 4096; // Higher resolution for better pitch detection
      analyser.smoothingTimeConstant = 0.8; // Smooth out rapid fluctuations
      source.connect(analyser);
      analyserRef.current = analyser;

      // Start continuous voice analysis (every 100ms)
      const intervalId = window.setInterval(() => {
        analyzeVoiceContinuously();
      }, 100);
      analysisIntervalRef.current = intervalId;

      setIsActive(true);
    } catch (error) {
      console.error("Failed to start voice analysis:", error);
      alert("Failed to access microphone. Please ensure microphone permissions are granted.");
      setIsActive(false);
    }
  };

  const stopRecording = () => {
    setIsActive(false);
    
    // Stop continuous analysis
    if (analysisIntervalRef.current) {
      clearInterval(analysisIntervalRef.current);
      analysisIntervalRef.current = null;
    }
    
    // Stop audio analysis
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    
    analyserRef.current = null;
    pitchHistoryRef.current = [];
    setSimIndex(999); // Stop demo if running
  };

  // Demo mode
  const startSimulation = () => {
    setIsActive(true);
    setAnalysis(null);
    setUseDemo(true);
    setSimIndex(0);
  };

  useEffect(() => {
    if (!isActive || !useDemo || simIndex >= MOCK_CONVERSATION.length) return;

    const step = MOCK_CONVERSATION[simIndex];
    
    const timer = setTimeout(() => {
      if (step.analysis) setAnalysis(step.analysis);
      
      setSimIndex(prev => prev + 1);
      
      if (simIndex + 1 >= MOCK_CONVERSATION.length) {
        setIsActive(false);
        setUseDemo(false);
      }
    }, step.delay);

    return () => clearTimeout(timer);
  }, [isActive, useDemo, simIndex]);

  useEffect(() => {
    return () => {
      if (analysisIntervalRef.current) {
        clearInterval(analysisIntervalRef.current);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  return (
    <div className="relative min-h-screen w-full flex flex-col bg-gradient-to-br from-background via-background to-primary/5 overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 opacity-30">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url(${generatedImage})`,
            filter: 'blur(2px)',
            transform: 'scale(1.1)'
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/50 to-background" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col h-screen">
        {/* Header */}
        <header className="border-b bg-card/50 backdrop-blur-sm">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className={`w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary/50 flex items-center justify-center ${isActive ? 'animate-pulse' : ''}`}>
                  {isActive ? <Mic className="w-6 h-6 text-primary-foreground" /> : <MicOff className="w-6 h-6 text-primary-foreground" />}
                </div>
                {isActive && (
                  <div className="absolute -inset-1 rounded-full bg-primary/20 animate-ping" />
                )}
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/50 bg-clip-text text-transparent">
                  Voice Persona
                </h1>
                <p className="text-sm text-muted-foreground">
                  {isActive ? "Live Analysis" : "Standby"}
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 container mx-auto px-4 py-6 flex gap-6 overflow-hidden">
          {/* Left Panel - Controls and Analysis */}
          <div className="w-full lg:w-2/5 flex flex-col gap-4">
            {/* Audio Visualizer */}
            <div className="bg-card/50 backdrop-blur-sm border rounded-lg p-6">
              <AudioVisualizer isActive={isActive} />
            </div>

            {/* Controls */}
            <div className="bg-card/50 backdrop-blur-sm border rounded-lg p-6 flex flex-col gap-4">
              <h2 className="text-lg font-semibold">Voice Analysis Controls</h2>
              
              <div className="flex gap-2">
                {!isActive ? (
                  <>
                    <Button
                      onClick={startRealRecording}
                      size="lg"
                      className="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
                    >
                      <Mic className="w-5 h-5 mr-2" />
                      START ANALYSIS
                    </Button>
                    <Button
                      onClick={startSimulation}
                      size="lg"
                      variant="outline"
                      className="flex-1"
                    >
                      <Play className="w-5 h-5 mr-2" />
                      DEMO MODE
                    </Button>
                  </>
                ) : (
                  <Button
                    onClick={stopRecording}
                    size="lg"
                    variant="destructive"
                    className="w-full"
                  >
                    <MicOff className="w-5 h-5 mr-2" />
                    STOP
                  </Button>
                )}
              </div>

              <Button
                onClick={() => { stopRecording(); setAnalysis(null); }}
                variant="outline"
                size="sm"
                disabled={!analysis}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Reset Analysis
              </Button>

              <div className="text-sm text-muted-foreground space-y-1">
                <p>• Click "START ANALYSIS" to begin real-time voice analysis</p>
                <p>• Speak naturally for accurate gender and age detection</p>
                <p>• Analysis based on pitch, frequency, and energy levels</p>
              </div>
            </div>

            {/* Analysis Panel */}
            {analysis && (
              <div className="bg-card/50 backdrop-blur-sm border rounded-lg overflow-hidden">
                <AnalysisPanel analysis={analysis} />
              </div>
            )}
          </div>

          {/* Right Panel - Info */}
          <div className="hidden lg:block flex-1">
            <div className="bg-card/50 backdrop-blur-sm border rounded-lg p-8 h-full flex flex-col">
              <h2 className="text-2xl font-bold mb-4">Real-Time Voice Analysis</h2>
              
              <div className="space-y-6 flex-1">
                <div>
                  <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                      🎤
                    </div>
                    Voice Analysis Technology
                  </h3>
                  <p className="text-muted-foreground">
                    Advanced audio signal processing analyzes your voice in real-time using pitch detection, 
                    frequency analysis, and energy distribution patterns.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                      🔊
                    </div>
                    How It Works
                  </h3>
                  <ul className="text-muted-foreground space-y-2">
                    <li>• <strong>Pitch Detection:</strong> Analyzes fundamental frequency (Male: 85-180Hz, Female: 165-255Hz)</li>
                    <li>• <strong>Energy Distribution:</strong> Examines low vs high frequency energy ratios</li>
                    <li>• <strong>Age Estimation:</strong> Based on voice characteristics and speech patterns</li>
                    <li>• <strong>Confidence Scoring:</strong> Real-time accuracy assessment</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                      📊
                    </div>
                    Analysis Metrics
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-background/50 p-4 rounded-lg">
                      <p className="text-sm text-muted-foreground">Gender Detection</p>
                      <p className="text-2xl font-bold">Pitch-based</p>
                    </div>
                    <div className="bg-background/50 p-4 rounded-lg">
                      <p className="text-sm text-muted-foreground">Age Estimation</p>
                      <p className="text-2xl font-bold">Pattern-based</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
