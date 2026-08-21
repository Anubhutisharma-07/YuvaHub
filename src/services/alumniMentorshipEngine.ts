import AlumniMentorshipSlot, { IAlumniMentorshipSlot } from '../models/alumniMentorshipSchema';

export interface MentorshipFilterQuery {
  campusName?: string;
  expertiseArea?: string;
  status?: string;
  search?: string;
}

export class AlumniMentorshipEngine {
  public static async registerSlot(payload: {
    mentorName: string;
    mentorAlumniBatchYear: number;
    mentorCurrentCompany: string;
    mentorCurrentRole: string;
    campusName: string;
    expertiseArea: 'SOFTWARE_ENGINEERING' | 'PRODUCT_MANAGEMENT' | 'AI_RESEARCH' | 'VENTURE_CAPITAL';
    availableSessionsCount: number;
    sessionTopics: string;
  }): Promise<IAlumniMentorshipSlot> {
    const slot = new AlumniMentorshipSlot({
      ...payload,
      status: 'OPEN',
    });
    return await slot.save();
  }

  public static async getSlots(filters: MentorshipFilterQuery): Promise<IAlumniMentorshipSlot[]> {
    const query: any = {};
    if (filters.campusName && filters.campusName !== 'All') {
      query.campusName = filters.campusName;
    }
    if (filters.expertiseArea && filters.expertiseArea !== 'All') {
      query.expertiseArea = filters.expertiseArea;
    }
    if (filters.status && filters.status !== 'All') {
      query.status = filters.status;
    }
    if (filters.search && filters.search.trim() !== '') {
      query.$or = [
        { mentorName: { $regex: filters.search, $options: 'i' } },
        { mentorCurrentCompany: { $regex: filters.search, $options: 'i' } },
        { sessionTopics: { $regex: filters.search, $options: 'i' } },
      ];
    }
    return await AlumniMentorshipSlot.find(query).sort({ createdAt: -1 });
  }

  public static async bookSession(
    slotId: string,
    studentId: string,
    studentName: string
  ): Promise<IAlumniMentorshipSlot | null> {
    return await AlumniMentorshipSlot.findByIdAndUpdate(
      slotId,
      {
        assignedStudentId: studentId,
        assignedStudentName: studentName,
        status: 'BOOKED',
      },
      { new: true }
    );
  }
}
