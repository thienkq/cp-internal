'use client';

import BirthdayWrapper from '@/components/birthday-wrapper';
import BirthdayBanner from '@/components/birthday-banner';
import AnniversaryWrapper from '@/components/anniversary-wrapper';
import WorkAnniversaryBanner from '@/components/work-anniversary-banner';
import { isBirthdayToday } from '@/lib/birthday-utils';
import { useDashboardContext } from '../member/dashboard/context';

export function AnniversarySection() {
  const { userName, userData, isAnniversary, anniversaryInfo } =
    useDashboardContext();
  const startDate = userData.start_date;
  const dateOfBirth = userData.date_of_birth;
  const isBirthday = dateOfBirth ? isBirthdayToday(dateOfBirth) : false;

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
        <BirthdayBanner userName={userName} dateOfBirth={dateOfBirth} />
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
