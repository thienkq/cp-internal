"use client";
import { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@workspace/ui/components/dialog";
import { Button } from "@workspace/ui/components/button";
import { Trophy, Sparkles, Calendar, Star } from "lucide-react";

interface WorkAnniversaryCelebrationProps {
  userName: string;
  years: number;
  onClose: () => void;
}

export default function WorkAnniversaryCelebration({ 
  userName, 
  years, 
  onClose 
}: WorkAnniversaryCelebrationProps) {
  const [confetti, setConfetti] = useState<Array<{
    id: number;
    x: number;
    y: number;
    color: string;
    type: string;
  }>>([]);

  useEffect(() => {
    // Generate confetti
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8'];
    const types = ['star', 'circle', 'square'];
    const newConfetti = Array.from({ length: 50 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      color: colors[Math.floor(Math.random() * colors.length)] || '#FF6B6B',
      type: types[Math.floor(Math.random() * types.length)] || 'star'
    }));
    setConfetti(newConfetti);

    // Auto-close after 8 seconds
    const timer = setTimeout(() => {
      onClose();
    }, 8000);

    return () => clearTimeout(timer);
  }, [onClose]);

  const getOrdinalSuffix = (num: number): string => {
    const j = num % 10;
    const k = num % 100;
    if (j === 1 && k !== 11) return "st";
    if (j === 2 && k !== 12) return "nd";
    if (j === 3 && k !== 13) return "rd";
    return "th";
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-md p-0 overflow-hidden bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 border-0 shadow-2xl">
        {/* Confetti overlay */}
        <div className="absolute inset-0 pointer-events-none">
          {confetti.map((particle) => (
            <div
              key={particle.id}
              className="absolute animate-bounce"
              style={{
                left: `${particle.x}%`,
                top: `${particle.y}%`,
                color: particle.color,
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${2 + Math.random() * 2}s`
              }}
            >
              {particle.type === 'star' && <Star className="w-4 h-4" />}
              {particle.type === 'circle' && <div className="w-4 h-4 rounded-full bg-current" />}
              {particle.type === 'square' && <div className="w-4 h-4 bg-current" />}
            </div>
          ))}
        </div>

        <div className="relative p-8 text-center">
          {/* Trophy and Sparkles */}
          <div className="mb-6 flex justify-center">
            <div className="relative">
              <Trophy className="w-16 h-16 text-yellow-500 animate-birthday-pulse" />
              <Sparkles className="absolute -top-2 -right-2 w-6 h-6 text-yellow-400 animate-birthday-sparkle" />
              <Sparkles className="absolute -bottom-2 -left-2 w-6 h-6 text-yellow-400 animate-birthday-sparkle" style={{ animationDelay: '0.5s' }} />
            </div>
          </div>

          {/* Anniversary Message */}
          <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-4 animate-birthday-bounce">
            🎉 Work Anniversary! 🎉
          </h2>

          <div className="mb-6">
            <p className="text-xl font-semibold text-gray-800 mb-2">
              Happy {years}{getOrdinalSuffix(years)} Anniversary!
            </p>
            <p className="text-lg text-gray-700 mb-4">
              {userName}
            </p>
            <div className="flex items-center justify-center gap-2 text-gray-600">
              <Calendar className="w-5 h-5" />
              <span className="text-sm">
                {years} {years === 1 ? 'year' : 'years'} of dedication and excellence!
              </span>
            </div>
          </div>

          {/* Celebration Message */}
          <div className="mb-6 p-4 bg-white/50 rounded-lg">
            <p className="text-gray-700">
              Thank you for your incredible contributions and dedication to our team. 
              Your hard work and commitment have made a lasting impact!
            </p>
          </div>

          {/* Close Button */}
          <Button 
            onClick={onClose}
            className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-semibold px-6 py-2 rounded-full shadow-lg hover:shadow-xl transition-all duration-200"
          >
            🎊 Celebrate!
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
} 