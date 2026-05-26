import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { ChevronLeft, BookOpen } from "lucide-react";

export function BasicsHub() {
  const [, setLocation] = useLocation();
  const { data: subsections, isLoading } = trpc.basics.getSubsections.useQuery();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      {/* Header */}
      <div className="mb-8">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setLocation("/")}
          className="mb-4"
        >
          <ChevronLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <h1 className="text-4xl font-bold text-gray-900 flex items-center gap-3">
          <BookOpen className="w-10 h-10 text-blue-600" />
          Basics/Must-Know
        </h1>
        <p className="text-gray-600 mt-2">Master the fundamentals of language learning</p>
      </div>

      {/* Subsections Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {subsections?.map((subsection) => (
          <Card
            key={subsection.subsection}
            className="p-6 cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => setLocation(`/basics/${subsection.subsection}`)}
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  {subsection.subsectionTitle}
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  {subsection.cardCount} cards
                </p>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all"
                style={{ width: "0%" }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-2">0 learned</p>

            {/* CTA */}
            <Button className="w-full mt-4 bg-blue-600 hover:bg-blue-700">
              Start Learning
            </Button>
          </Card>
        ))}
      </div>

      {/* Stats Footer */}
      <div className="mt-12 text-center">
        <p className="text-gray-600">
          Total cards available: <span className="font-bold text-gray-900">{subsections?.reduce((sum, s) => sum + s.cardCount, 0) || 0}</span>
        </p>
      </div>
    </div>
  );
}
