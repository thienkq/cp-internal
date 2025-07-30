"use client";

import { useState } from "react";
import { Alert } from "@workspace/ui/components/alert";
import { Button } from "@workspace/ui/components/button";
import { Cake, Sparkles, Heart } from "lucide-react";
import { getBirthdayMessage, getOrdinalSuffix } from "@/lib/birthday-utils";
import BirthdayCelebration from "./birthday-celebration";

interface BirthdayBannerProps {
  userName: string;
  dateOfBirth: string | null | undefined;
}

export default function BirthdayBanner({ userName, dateOfBirth }: BirthdayBannerProps) {
  const [showModal, setShowModal] = useState(false);
  
  // Calculate age from date of birth
  const calculateAge = (dateOfBirth: string | null | undefined): number => {
    if (!dateOfBirth) return 0;
    
    const birthDate = new Date(dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    
    // Adjust age if birthday hasn't occurred yet this year
    const birthdayThisYear = new Date(today.getFullYear(), birthDate.getMonth(), birthDate.getDate());
    if (today < birthdayThisYear) {
      age--;
    }
    
    return Math.max(0, age);
  };
  
  const age = calculateAge(dateOfBirth);
  const birthdayMessage = getBirthdayMessage(userName, age);

  const handleCelebrate = () => {
    setShowModal(true);
  };

  return (
    <>
      <Alert variant="default" className="my-2 flex items-center gap-3 bg-gradient-to-r from-pink-50 via-purple-50 to-blue-50 border-2 border-pink-200 shadow-lg">
        <div className="flex items-center gap-2">
          <Cake className="h-6 w-6 text-pink-500 animate-birthday-pulse" />
          <Sparkles className="h-4 w-4 text-yellow-400 animate-birthday-sparkle" />
        </div>
        <div className="flex-1">
          <div className="font-bold text-pink-800 text-lg">{birthdayMessage}</div>
          <div className="text-sm text-pink-700 flex items-center gap-2">
            <Heart className="h-4 w-4 text-red-400" />
            Wishing you a fantastic year ahead. Enjoy your special day!
          </div>
        </div>
        <Button 
          size="sm"
          className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white font-semibold px-4 py-1 rounded-full shadow-md hover:shadow-lg transition-all duration-200"
          onClick={handleCelebrate}
        >
          🎂 Celebrate!
        </Button>
      </Alert>

      {showModal && (
        <BirthdayCelebration 
          userName={userName} 
          onClose={() => setShowModal(false)} 
        />
      )}
    </>
  );
} 