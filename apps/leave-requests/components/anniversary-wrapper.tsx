"use client";
import { useState, useEffect } from "react";
import WorkAnniversaryCelebration from "./work-anniversary-celebration";

interface AnniversaryWrapperProps {
  userName: string;
  years: number;
  isAnniversary: boolean;
}

export default function AnniversaryWrapper({ 
  userName, 
  years, 
  isAnniversary 
}: AnniversaryWrapperProps) {
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (isAnniversary) {
      const timer = setTimeout(() => {
        setShowModal(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isAnniversary]);

  if (!isAnniversary) return null;

  return (
    <>
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