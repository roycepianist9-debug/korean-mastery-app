import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ChevronLeft, ChevronRight, Plus, Check, Volume2 } from "lucide-react";
import { trpc } from "@/lib/trpc";

interface Synonym {
  word: string;
  register?: 'formal' | 'casual' | 'sophisticated' | 'slang' | 'archaic' | 'british' | 'australian' | 'nuanced';
}

interface EnglishWord {
  id: number;
  word: string;
  partOfSpeech: string;
  synonyms: Synonym[];
  level: 'beginner' | 'intermediate' | 'advanced';
}

const registerColors: Record<string, string> = {
  formal: 'bg-blue-100 text-blue-800',
  casual: 'bg-green-100 text-green-800',
  sophisticated: 'bg-purple-100 text-purple-800',
  slang: 'bg-orange-100 text-orange-800',
  archaic: 'bg-gray-100 text-gray-800',
  british: 'bg-red-100 text-red-800',
  australian: 'bg-yellow-100 text-yellow-800',
  nuanced: 'bg-pink-100 text-pink-800',
};

const levelColors: Record<string, string> = {
  beginner: 'bg-green-200 text-green-900',
  intermediate: 'bg-blue-200 text-blue-900',
  advanced: 'bg-purple-200 text-purple-900',
};

export function EnglishSynonymCardClean({ words, currentIndex, onNext, onPrev }: {
  words: EnglishWord[];
  currentIndex: number;
  onNext: () => void;
  onPrev: () => void;
}) {
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const saveWordMutation = trpc.savedWords.save.useMutation();

  if (!words || words.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="text-gray-600">No words available for this level</p>
      </Card>
    );
  }

  const currentWord = words[currentIndex];
  if (!currentWord) return null;

  const handleSaveWord = async () => {
    setIsSaving(true);
    try {
      await saveWordMutation.mutateAsync({
        word: currentWord.word,
        language: 'english',
        partOfSpeech: currentWord.partOfSpeech,
      });
      setIsSaved(true);
    } catch (error) {
      console.error('Failed to save word:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSpeak = (text: string) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    window.speechSynthesis.speak(utterance);
  };

  return (
    <Card className="p-6 space-y-6">
      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          size="icon"
          onClick={onPrev}
          disabled={currentIndex === 0}
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>
        
        <span className="text-sm text-gray-600">
          {currentIndex + 1} / {words.length}
        </span>
        
        <Button
          variant="outline"
          size="icon"
          onClick={onNext}
          disabled={currentIndex === words.length - 1}
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      {/* Main Word */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-4xl font-bold">{currentWord.word}</h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleSpeak(currentWord.word)}
              className="text-blue-600 hover:text-blue-800"
            >
              <Volume2 className="w-5 h-5" />
            </Button>
          </div>
          
          <div className="flex items-center gap-2">
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${levelColors[currentWord.level]}`}>
              {currentWord.level.charAt(0).toUpperCase() + currentWord.level.slice(1)}
            </span>
            <Button
              size="sm"
              variant={isSaved ? 'default' : 'outline'}
              onClick={handleSaveWord}
              disabled={isSaving}
              className="gap-2"
            >
              {isSaved ? (
                <>
                  <Check className="w-4 h-4" />
                  Saved
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  Save
                </>
              )}
            </Button>
          </div>
        </div>

        <p className="text-sm text-gray-600">{currentWord.partOfSpeech}</p>
      </div>

      {/* Synonyms */}
      <div className="space-y-3">
        <h3 className="font-semibold text-gray-900">Synonyms ({currentWord.synonyms.length})</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-96 overflow-y-auto">
          {currentWord.synonyms.map((syn, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition"
            >
              <div className="flex items-center gap-2 flex-1">
                <span className="font-medium text-gray-900">{syn.word}</span>
                {syn.register && (
                  <span className={`text-xs px-2 py-1 rounded-full ${registerColors[syn.register] || 'bg-gray-100'}`}>
                    {syn.register}
                  </span>
                )}
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleSpeak(syn.word)}
                className="text-gray-600 hover:text-blue-600"
              >
                <Volume2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
