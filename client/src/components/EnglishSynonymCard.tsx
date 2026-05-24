import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Volume2, Plus, Check } from 'lucide-react';
import { useAudio } from '@/hooks/useAudio';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/_core/hooks/useAuth';
import { toast } from 'sonner';

interface EnglishSynonymCardProps {
  word: string;
  partOfSpeech: string;
  synonyms: string[];
  level: 'beginner' | 'intermediate' | 'advanced';
  onSave?: (word: string) => void;
}

export function EnglishSynonymCard({
  word,
  partOfSpeech,
  synonyms,
  level,
  onSave,
}: EnglishSynonymCardProps) {
  const auth = useAuth();
  const { speak } = useAudio();
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const saveWordMutation = trpc.savedWords.add.useMutation();

  const handleSaveWord = async () => {
    if (!auth.user) {
      toast.error('Please log in to save words');
      return;
    }

    setIsSaving(true);
    try {
      // For now, we'll create a temporary word ID based on the word
      // In a full implementation, we'd need to create English words in the database
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
        {/* Header with word and level */}
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h2 className="text-3xl font-bold text-gray-900">{word}</h2>
            <p className="text-sm text-gray-600 mt-1">{partOfSpeech}</p>
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

        {/* Synonyms list */}
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-gray-700">Synonyms ({synonyms.length})</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-96 overflow-y-auto">
            {synonyms.map((synonym, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors group"
              >
                <span className="text-gray-800 font-medium">{synonym}</span>
                <button
                  onClick={() => handleSpeak(synonym)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-gray-200 rounded"
                  title={`Pronounce "${synonym}"`}
                >
                  <Volume2 className="w-4 h-4 text-blue-600" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Main word TTS button */}
        <div className="pt-2 border-t">
          <Button
            onClick={() => handleSpeak(word)}
            variant="outline"
            className="w-full gap-2"
          >
            <Volume2 className="w-4 h-4" />
            Pronounce "{word}"
          </Button>
        </div>
      </div>
    </Card>
  );
}
