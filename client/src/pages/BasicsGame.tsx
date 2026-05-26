import { useState, useEffect } from "react";
import { useLocation, useRoute } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { ChevronLeft, ChevronRight, Volume2 } from "lucide-react";

export function BasicsGame() {
  const [, setLocation] = useLocation();
  const [match, params] = useRoute("/basics/:subsection");
  const subsection = params?.subsection || "";

  const [currentIndex, setCurrentIndex] = useState(0);
  const { data: cards, isLoading } = trpc.basics.getBySubsection.useQuery(
    { subsection },
    { enabled: !!subsection }
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner />
      </div>
    );
  }

  if (!cards || cards.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="p-8 text-center">
          <p className="text-gray-600">No cards found for this subsection.</p>
          <Button onClick={() => setLocation("/basics")} className="mt-4">
            Back to Basics
          </Button>
        </Card>
      </div>
    );
  }

  const currentCard = cards[currentIndex];

  const handleSwipe = (direction: "left" | "right") => {
    // Left = Learn, Right = Review
    console.log(`Swiped ${direction}: ${currentCard.front}`);
    
    if (currentIndex < cards.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      // End of subsection
      setLocation("/basics");
    }
  };

  const handleNext = () => handleSwipe("left");
  const handlePrev = () => {
    if (currentIndex > 0) setCurrentIndex(currentIndex - 1);
  };

  const playAudio = async (text: string) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setLocation("/basics")}
        >
          <ChevronLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <h2 className="text-xl font-bold text-gray-900">
          {currentCard.subsectionTitle}
        </h2>
        <div className="text-sm text-gray-600">
          {currentIndex + 1} / {cards.length}
        </div>
      </div>

      {/* Main Card */}
      <div className="flex-1 flex items-center justify-center">
        <Card className="w-full max-w-md p-8 shadow-2xl">
          {/* Front */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <h3 className="text-4xl font-bold text-gray-900">
                {currentCard.front}
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => playAudio(currentCard.front)}
                className="text-blue-600 hover:text-blue-700"
              >
                <Volume2 className="w-5 h-5" />
              </Button>
            </div>

            {/* Back */}
            <div className="bg-blue-50 p-4 rounded-lg mb-4">
              <p className="text-gray-700">{currentCard.back}</p>
            </div>

            {/* Example */}
            <div className="bg-amber-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600 italic">"{currentCard.example}"</p>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex gap-4 justify-center">
            <Button
              variant="outline"
              onClick={handlePrev}
              disabled={currentIndex === 0}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              className="flex-1 bg-blue-600 hover:bg-blue-700"
              onClick={handleNext}
            >
              Next → Learn
            </Button>
            <Button
              variant="outline"
              onClick={() => handleSwipe("right")}
            >
              Review ←
            </Button>
          </div>
        </Card>
      </div>

      {/* Progress Bar */}
      <div className="mt-6 max-w-md mx-auto w-full">
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all"
            style={{ width: `${((currentIndex + 1) / cards.length) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}
