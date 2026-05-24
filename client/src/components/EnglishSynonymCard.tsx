import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Volume2, Plus, Check, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAudio } from '@/hooks/useAudio';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/_core/hooks/useAuth';
import { toast } from 'sonner';

interface Synonym {
  word: string;
  register?: 'formal' | 'casual' | 'sophisticated' | 'slang' | 'archaic' | 'british' | 'australian' | 'nuanced';
}

interface EnglishSynonymCardProps {
  word: string;
  partOfSpeech: string;
  meaning?: string;
  exampleSentence?: string;
  synonyms: Synonym[] | string[];
  level: 'beginner' | 'intermediate' | 'advanced';
  onSave?: (word: string) => void;
  onNext?: () => void;
  onPrevious?: () => void;
  canGoNext?: boolean;
  canGoPrevious?: boolean;
}

const REGISTER_COLORS: Record<string, string> = {
  formal: 'bg-blue-100 text-blue-800',
  casual: 'bg-green-100 text-green-800',
  sophisticated: 'bg-purple-100 text-purple-800',
  slang: 'bg-pink-100 text-pink-800',
  archaic: 'bg-amber-100 text-amber-800',
  british: 'bg-red-100 text-red-800',
  australian: 'bg-orange-100 text-orange-800',
  nuanced: 'bg-indigo-100 text-indigo-800',
};

export function EnglishSynonymCard({
  word,
  partOfSpeech,
  meaning,
  exampleSentence,
  synonyms: rawSynonyms,
  level,
  onSave,
  onNext,
  onPrevious,
  canGoNext = false,
  canGoPrevious = false,
}: EnglishSynonymCardProps) {
  const auth = useAuth();
  const { speak } = useAudio();
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const saveWordMutation = trpc.savedWords.add.useMutation();

  // Normalize synonyms to object format
  const synonyms: Synonym[] = rawSynonyms.map(s => 
    typeof s === 'string' ? { word: s } : s
  );

  const handleSaveWord = async () => {
    if (!auth.user) {
      toast.error('Please log in to save words');
      return;
    }

    setIsSaving(true);
    try {
      const wordId = Math.abs(word.charCodeAt(0) * word.charCodeAt(word.length - 1));
      await saveWordMutation.mutateAsync({ wordId });
      setIsSaved(true);
      toast.success(`"${word}" saved!`);
      onSave?.(word);
    } catch (error) {
      toast.error('Failed to save word');
      console.error('Save error:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSpeak = (text: string) => {
    speak(text);
  };

  const levelColors = {
    beginner: 'bg-green-100 text-green-800',
    intermediate: 'bg-yellow-100 text-yellow-800',
    advanced: 'bg-purple-100 text-purple-800',
  };

  return (
    <Card className="p-6 bg-white shadow-lg hover:shadow-xl transition-shadow">
      <div className="space-y-4">
        {/* Top Navigation */}
        <div className="flex items-center justify-between mb-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={onPrevious}
            disabled={!canGoPrevious}
            className="gap-2"
          >
            <ChevronLeft className="w-4 h-4" />
            Back
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onNext}
            disabled={!canGoNext}
            className="gap-2"
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        {/* Header with word and level */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h2 className="text-3xl font-bold text-gray-900">{word}</h2>
              <button
                onClick={() => handleSpeak(word)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title={`Pronounce "${word}"`}
              >
                <Volume2 className="w-5 h-5 text-blue-600" />
              </button>
            </div>
            <p className="text-sm text-gray-600">{partOfSpeech}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${levelColors[level]}`}>
              {level.charAt(0).toUpperCase() + level.slice(1)}
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

        {/* Meaning */}
        {meaning && (
          <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm text-gray-700">
              <span className="font-semibold text-gray-900">Definition: </span>
              {meaning}
            </p>
          </div>
        )}

        {/* Example Sentence */}
        {exampleSentence && (
          <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
            <p className="text-sm text-gray-700">
              <span className="font-semibold text-gray-900">Example: </span>
              {exampleSentence}
            </p>
          </div>
        )}

        {/* Synonyms list */}
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-gray-700">Synonyms ({synonyms.length})</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-96 overflow-y-auto">
            {synonyms.map((synonym, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors group"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-gray-800 font-medium">{synonym.word}</span>
                    {synonym.register && (
                      <span className={`px-2 py-0.5 rounded text-xs font-semibold ${REGISTER_COLORS[synonym.register] || 'bg-gray-100 text-gray-800'}`}>
                        {synonym.register}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => handleSpeak(synonym.word)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-gray-200 rounded ml-2 flex-shrink-0"
                  title={`Pronounce "${synonym.word}"`}
                >
                  <Volume2 className="w-4 h-4 text-blue-600" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}
