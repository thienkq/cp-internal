"use client";
import { useState } from "react";
import { Alert } from "@workspace/ui/components/alert";
import { Button } from "@workspace/ui/components/button";
import { Trophy, Sparkles, Calendar, Heart } from "lucide-react";
import { getAnniversaryMessage } from "@/lib/anniversary-utils";
import WorkAnniversaryCelebration from "./work-anniversary-celebration";

interface WorkAnniversaryBannerProps {
  userName: string;
  years: number;
  startDate: string;
}

export default function WorkAnniversaryBanner({ 
  userName, 
  years, 
  startDate 
}: WorkAnniversaryBannerProps) {
  const [showModal, setShowModal] = useState(false);
  const anniversaryMessage = getAnniversaryMessage(userName, years);

  const handleCelebrate = () => {
    setShowModal(true);
  };

  const formatStartDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  return (
    <>
      <Alert variant="default" className="my-2 flex items-center gap-3 bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50 border-2 border-blue-200 shadow-lg">
        <div className="flex items-center gap-2">
          <Trophy className="h-6 w-6 text-yellow-500 animate-birthday-pulse" />
          <Sparkles className="h-4 w-4 text-yellow-400 animate-birthday-sparkle" />
        </div>
        <div className="flex-1">
          <div className="font-bold text-blue-800 text-lg">{anniversaryMessage}</div>
          <div className="text-sm text-blue-700 flex items-center gap-2">
            <Calendar className="h-4 w-4 text-blue-500" />
            Started on {formatStartDate(startDate)}
          </div>
          <div className="text-sm text-blue-600 flex items-center gap-2 mt-1">
            <Heart className="h-4 w-4 text-red-400" />
            {years} {years === 1 ? 'year' : 'years'} of amazing contributions!
          </div>
        </div>
        <Button 
          size="sm"
          className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-semibold px-4 py-1 rounded-full shadow-md hover:shadow-lg transition-all duration-200"
          onClick={handleCelebrate}
        >
          🏆 Celebrate!
        </Button>
      </Alert>

      {showModal && (
        <WorkAnniversaryCelebration 
          userName={userName} 
          years={years}
          onClose={() => setShowModal(false)} 
        />
      )}
    </>
  );
} 