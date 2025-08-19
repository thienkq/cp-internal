import BirthdayWrapper from "@/components/birthday-wrapper";
import BirthdayBanner from "@/components/birthday-banner";
import AnniversaryWrapper from "@/components/anniversary-wrapper";
import WorkAnniversaryBanner from "@/components/work-anniversary-banner";
import { isBirthdayToday } from "@/lib/birthday-utils";
import { isWorkAnniversaryToday, getAnniversaryInfo } from "@/lib/anniversary-utils";

interface AnniversarySectionProps {
  userName: string;
  dateOfBirth?: string;
  startDate?: string;
  userId: string;
}

export async function AnniversarySection({ 
  userName, 
  dateOfBirth, 
  startDate, 
  userId
}: AnniversarySectionProps) {
  const isBirthday = dateOfBirth ? isBirthdayToday(dateOfBirth) : false;
  const isAnniversary = startDate
    ? await isWorkAnniversaryToday(startDate, userId)
    : false;
  const anniversaryInfo = startDate
    ? await getAnniversaryInfo(startDate, userId)
    : null;

  return (
    <>
      {/* Birthday Celebration Modal */}
      <BirthdayWrapper userName={userName} isBirthday={isBirthday} />

      {/* Work Anniversary Celebration Modal */}
      <AnniversaryWrapper 
        userName={userName} 
        years={anniversaryInfo?.years || 0}
        isAnniversary={isAnniversary} 
      />

      {/* Birthday Banner */}
      {isBirthday && dateOfBirth && (
        <BirthdayBanner 
          userName={userName} 
          dateOfBirth={dateOfBirth}
        />
      )}

      {/* Work Anniversary Banner */}
      {isAnniversary && anniversaryInfo && startDate && (
        <WorkAnniversaryBanner 
          userName={userName} 
          years={anniversaryInfo.years}
          startDate={startDate}
        />
      )}
    </>
  );
} 