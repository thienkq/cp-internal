"use client";

import { useState, useEffect } from "react";
import { Card } from "@workspace/ui/components/card";
import { Button } from "@workspace/ui/components/button";
import { X, Gift, Cake, Sparkles, Heart, Star } from "lucide-react";

interface BirthdayCelebrationProps {
  userName: string;
  onClose?: () => void;
}

export default function BirthdayCelebration({ userName, onClose }: BirthdayCelebrationProps) {
  const [showConfetti, setShowConfetti] = useState(true);
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; color: string; type: string }>>([]);

  useEffect(() => {
    // Generate confetti particles
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8'];
    const types = ['star', 'heart', 'circle'];
    const newParticles = Array.from({ length: 50 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      color: colors[Math.floor(Math.random() * colors.length)] || '#FF6B6B',
      type: types[Math.floor(Math.random() * types.length)] || 'star'
    }));
    setParticles(newParticles);

    // Auto-hide confetti after 5 seconds
    const timer = setTimeout(() => setShowConfetti(false), 5000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <Card className="relative max-w-md w-full mx-4 overflow-hidden bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 border-2 border-pink-200 shadow-2xl">
        {/* Confetti overlay */}
        {showConfetti && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {particles.map((particle) => (
              <div
                key={particle.id}
                className="absolute animate-bounce"
                style={{
                  left: `${particle.x}%`,
                  top: `${particle.y}%`,
                  color: particle.color,
                  animationDelay: `${Math.random() * 2}s`,
                  animationDuration: `${1 + Math.random() * 2}s`
                }}
              >
                {particle.type === 'star' && <Star className="w-4 h-4" fill="currentColor" />}
                {particle.type === 'heart' && <Heart className="w-4 h-4" fill="currentColor" />}
                {particle.type === 'circle' && <div className="w-3 h-3 rounded-full bg-current" />}
              </div>
            ))}
          </div>
        )}

        {/* Close button */}
        {onClose && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="absolute top-2 right-2 z-10 hover:bg-white/20"
          >
            <X className="w-4 h-4" />
          </Button>
        )}

        {/* Main content */}
        <div className="relative p-8 text-center">
          {/* Animated cake icon */}
          <div className="mb-6 flex justify-center">
            <div className="relative">
              <Cake className="w-16 h-16 text-pink-500 animate-birthday-pulse" />
              <Sparkles className="absolute -top-2 -right-2 w-6 h-6 text-yellow-400 animate-birthday-sparkle" />
              <Sparkles className="absolute -bottom-2 -left-2 w-6 h-6 text-yellow-400 animate-birthday-sparkle" style={{ animationDelay: '0.5s' }} />
            </div>
          </div>

          {/* Birthday message */}
          <h2 className="text-3xl font-bold bg-gradient-to-r from-pink-600 via-purple-600 to-blue-600 bg-clip-text text-transparent mb-4 animate-birthday-bounce">
            🎉 Happy Birthday! 🎉
          </h2>
          
          <p className="text-lg text-gray-700 mb-6">
            Wishing <span className="font-semibold text-purple-600">{userName}</span> a fantastic day filled with joy, laughter, and wonderful surprises!
          </p>

          {/* Birthday wishes */}
          <div className="space-y-3 mb-6">
            <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
              <Heart className="w-4 h-4 text-red-400" />
              <span>May your day be as special as you are!</span>
            </div>
            <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
              <Gift className="w-4 h-4 text-green-400" />
              <span>Here's to another amazing year ahead!</span>
            </div>
            <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
              <Star className="w-4 h-4 text-yellow-400" />
              <span>Celebrate and enjoy every moment!</span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-3 justify-center">
            <Button 
              className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white font-semibold px-6 py-2 rounded-full shadow-lg hover:shadow-xl transition-all duration-200"
              onClick={() => {
                // Add any birthday-specific actions here
                console.log('Birthday celebration action!');
              }}
            >
              🎂 Celebrate!
            </Button>
            {onClose && (
              <Button 
                variant="outline" 
                className="border-purple-300 text-purple-600 hover:bg-purple-50 px-6 py-2 rounded-full"
                onClick={onClose}
              >
                Thanks! 😊
              </Button>
            )}
          </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-pink-400 via-purple-400 to-blue-400"></div>
        <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400"></div>
      </Card>
    </div>
  );
} 