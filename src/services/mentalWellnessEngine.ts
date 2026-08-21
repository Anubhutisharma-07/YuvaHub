import MentalWellnessCheckIn, { IMentalWellnessCheckIn } from '../models/mentalWellnessCheckInSchema';

export interface WellnessFilterQuery {
  campusName?: string;
  stressLevel?: string;
  sessionStatus?: string;
  search?: string;
}

export class StudentMentalWellnessEngine {
  public static calculateBurnoutScore(moodRating: number, stressLevel: string): number {
    let baseScore = (6 - moodRating) * 15;
    if (stressLevel === 'CRITICAL') baseScore += 25;
    else if (stressLevel === 'HIGH') baseScore += 18;
    else if (stressLevel === 'MODERATE') baseScore += 10;
    return Math.min(Math.max(baseScore, 5), 100);
  }

  public static async createCheckIn(payload: {
    studentId: string;
    studentName: string;
    campusName: string;
    moodRating: number;
    stressLevel: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
    primaryStressor: 'ACADEMICS' | 'EXAMS' | 'JOB_HUNT' | 'FINANCES' | 'PERSONAL';
    supportRequested: boolean;
    confidentialNotes?: string;
  }): Promise<IMentalWellnessCheckIn> {
    const burnoutScorePercent = this.calculateBurnoutScore(payload.moodRating, payload.stressLevel);

    const checkIn = new MentalWellnessCheckIn({
      ...payload,
      burnoutScorePercent,
      sessionStatus: payload.supportRequested ? 'PENDING' : 'RESOLVED',
    });

    return await checkIn.save();
  }

  public static async getCheckIns(filters: WellnessFilterQuery): Promise<IMentalWellnessCheckIn[]> {
    const query: any = {};
    if (filters.campusName && filters.campusName !== 'All') {
      query.campusName = filters.campusName;
    }
    if (filters.stressLevel && filters.stressLevel !== 'All') {
      query.stressLevel = filters.stressLevel;
    }
    if (filters.sessionStatus && filters.sessionStatus !== 'All') {
      query.sessionStatus = filters.sessionStatus;
    }
    if (filters.search && filters.search.trim() !== '') {
      query.$or = [
        { studentName: { $regex: filters.search, $options: 'i' } },
        { studentId: { $regex: filters.search, $options: 'i' } },
      ];
    }
    return await MentalWellnessCheckIn.find(query).sort({ createdAt: -1 });
  }

  public static async assignCounselor(
    checkInId: string,
    counselorName: string
  ): Promise<IMentalWellnessCheckIn | null> {
    return await MentalWellnessCheckIn.findByIdAndUpdate(
      checkInId,
      { counselorAssigned: counselorName, sessionStatus: 'SCHEDULED' },
      { new: true }
    );
  }
}
