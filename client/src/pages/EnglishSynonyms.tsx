import React, { useState, useEffect } from 'react';
import { useAuth } from '@/_core/hooks/useAuth';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { useLocation } from 'wouter';
import { EnglishSynonymCard } from '@/components/EnglishSynonymCard';
import { Spinner } from '@/components/ui/spinner';
import { toast } from 'sonner';

export default function EnglishSynonyms() {
  const auth = useAuth();
  const [, setLocation] = useLocation();
  const [level, setLevel] = useState<'beginner' | 'intermediate' | 'advanced'>('beginner');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [savedWords, setSavedWords] = useState<Set<string>>(new Set());

  // Fetch English synonyms by level
  const { data: synonymsData, isLoading, refetch } = trpc.englishSynonyms.getByLevel.useQuery(
    { level },
    { enabled: !!auth.user }
  );

  const synonyms = synonymsData || [];
  const currentWord = synonyms[currentIndex];

  useEffect(() => {
    setCurrentIndex(0);
  }, [level]);

  const handleNext = () => {
    if (currentIndex < synonyms.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleSaveWord = (word: string) => {
    setSavedWords(prev => new Set([...prev, word]));
  };

  if (!auth.user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="p-8 text-center max-w-md">
          <h2 className="text-2xl font-bold mb-4">Sign In Required</h2>
          <p className="text-gray-600 mb-6">
            Please sign in to access the English Synonyms feature.
          </p>
          <Button onClick={() => setLocation('/')} className="w-full">
            Back to Home
          </Button>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (!currentWord) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="p-8 text-center max-w-md">
          <h2 className="text-2xl font-bold mb-4">No Words Available</h2>
          <p className="text-gray-600 mb-6">
            No synonyms found for the selected level.
          </p>
          <Button onClick={() => setLocation('/play')} className="w-full">
            Back to Play
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 md:p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => setLocation('/play')}
            className="gap-2"
          >
            <ChevronLeft className="w-4 h-4" />
            Back
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">Polish Your English</h1>
          <div className="w-20" /> {/* Spacer for alignment */}
        </div>

        {/* Level selector */}
        <Card className="p-4 bg-white">
          <div className="flex items-center gap-4">
            <label className="text-sm font-semibold text-gray-700">Difficulty Level:</label>
            <Select value={level} onValueChange={(value: any) => setLevel(value)}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="beginner">Beginner</SelectItem>
                <SelectItem value="intermediate">Intermediate</SelectItem>
                <SelectItem value="advanced">Advanced</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </Card>

        {/* Main card */}
        <EnglishSynonymCard
          word={currentWord.word}
          partOfSpeech={currentWord.partOfSpeech}
          synonyms={JSON.parse(currentWord.synonyms as any)}
          level={currentWord.level}
          onSave={handleSaveWord}
        />

        {/* Navigation */}
        <div className="flex items-center justify-between gap-4">
          <Button
            onClick={handlePrevious}
            disabled={currentIndex === 0}
            variant="outline"
            className="gap-2"
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </Button>

          <div className="text-center">
            <p className="text-sm text-gray-600">
              Word {currentIndex + 1} of {synonyms.length}
            </p>
            <div className="w-64 h-2 bg-gray-200 rounded-full mt-2 overflow-hidden">
              <div
                className="h-full bg-blue-600 transition-all duration-300"
                style={{ width: `${((currentIndex + 1) / synonyms.length) * 100}%` }}
              />
            </div>
          </div>

          <Button
            onClick={handleNext}
            disabled={currentIndex === synonyms.length - 1}
            variant="outline"
            className="gap-2"
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        {/* Stats */}
        <Card className="p-4 bg-white text-center">
          <p className="text-sm text-gray-600">
            Saved: <span className="font-bold text-blue-600">{savedWords.size}</span> words
          </p>
        </Card>
      </div>
    </div>
  );
}
