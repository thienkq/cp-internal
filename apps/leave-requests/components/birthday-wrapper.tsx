"use client";

import { useState, useEffect } from "react";
import BirthdayCelebration from "./birthday-celebration";

interface BirthdayWrapperProps {
  userName: string;
  isBirthday: boolean;
}

export default function BirthdayWrapper({ userName, isBirthday }: BirthdayWrapperProps) {
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (isBirthday) {
      // Show the modal after a short delay to ensure the page is loaded
      const timer = setTimeout(() => {
        setShowModal(true);
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [isBirthday]);

  if (!isBirthday) return null;

  return (
    <>
      {showModal && (
        <BirthdayCelebration 
          userName={userName} 
          onClose={() => setShowModal(false)} 
        />
      )}
    </>
  );
} 