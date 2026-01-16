import { Message } from "@/components/chat-transcript";
import { AnalysisData } from "@/components/analysis-panel";

export const MOCK_CONVERSATION: {
  delay: number;
  message?: Message;
  analysis?: AnalysisData;
  typing?: boolean;
}[] = [
  {
    delay: 1000,
    typing: true
  },
  {
    delay: 2500,
    typing: false,
    message: {
      id: "1",
      role: "ai",
      text: "Hello! I'm Aura. I'm listening. Feel free to speak naturally.",
      timestamp: new Date()
    }
  },
  {
    delay: 4000,
    message: {
      id: "2",
      role: "user",
      text: "Hi there. I was just wondering if you could help me figure out a good birthday present for my brother? He's turning 25 soon.",
      timestamp: new Date()
    },
    analysis: {
      age_range: "23-28",
      gender: "Female",
      confidence: "medium"
    }
  },
  {
    delay: 5500,
    typing: true
  },
  {
    delay: 7500,
    typing: false,
    message: {
      id: "3",
      role: "ai",
      text: "I'd be happy to help! What kind of hobbies does your brother have? Is he into tech, sports, or maybe music?",
      timestamp: new Date()
    }
  },
  {
    delay: 9500,
    message: {
      id: "4",
      role: "user",
      text: "Well, honestly, he's super into retro gaming lately. We used to play a lot of Mario Kart when we were kids in the 90s, so maybe something like that?",
      timestamp: new Date()
    },
    analysis: {
      age_range: "28-35",
      gender: "Female",
      confidence: "high"
    }
  },
  {
    delay: 11000,
    typing: true
  },
  {
    delay: 13000,
    typing: false,
    message: {
      id: "5",
      role: "ai",
      text: "Retro gaming is a fantastic theme! Since you mentioned 90s nostalgia, maybe a modern handheld emulator or a vintage console restoration kit would be perfect.",
      timestamp: new Date()
    }
  },
  {
    delay: 16000,
    message: {
      id: "6",
      role: "ai",
      text: "That sounds awesome. I think he'd love an emulator. Thanks for the suggestion!",
      timestamp: new Date()
    }
  }
];
