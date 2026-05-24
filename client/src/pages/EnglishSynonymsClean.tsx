import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { EnglishSynonymCardClean } from "@/components/EnglishSynonymCardClean";
import { trpc } from "@/lib/trpc";
import { ChevronLeft } from "lucide-react";

type Level = 'beginner' | 'intermediate' | 'advanced';

export function EnglishSynonymsClean() {
  const [, setLocation] = useLocation();
  const [level, setLevel] = useState<Level>('beginner');
  const [currentIndex, setCurrentIndex] = useState(0);

  const { data: wordsData, isLoading } = trpc.englishSynonyms.getByLevel.useQuery(
    { level },
    { enabled: true }
  );

  const words = wordsData || [];

  const handleNext = () => {
    if (currentIndex < words.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleLevelChange = (newLevel: string) => {
    setLevel(newLevel as Level);
    setCurrentIndex(0);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setLocation('/')}
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Polish Your English</h1>
              <p className="text-gray-600">Learn synonyms and expand your vocabulary</p>
            </div>
          </div>
        </div>

        {/* Level Selector */}
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Difficulty Level
          </label>
          <Select value={level} onValueChange={handleLevelChange}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="beginner">Beginner</SelectItem>
              <SelectItem value="intermediate">Intermediate</SelectItem>
              <SelectItem value="advanced">Advanced</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <Spinner />
          </div>
        ) : words.length === 0 ? (
          <div className="bg-white p-8 rounded-lg border border-gray-200 text-center">
            <p className="text-gray-600">No words available for this level yet</p>
          </div>
        ) : (
          <EnglishSynonymCardClean
            words={words}
            currentIndex={currentIndex}
            onNext={handleNext}
            onPrev={handlePrev}
          />
        )}
      </div>
    </div>
  );
}
