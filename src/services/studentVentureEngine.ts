import StudentVentureFund, { IStudentVentureFund } from '../models/studentVentureSchema';

export interface VentureFilterQuery {
  campusName?: string;
  sectorDomain?: string;
  fundingStage?: string;
  search?: string;
}

export class StudentVentureEngine {
  public static async registerVenture(payload: {
    startupName: string;
    campusName: string;
    studentFounderName: string;
    sectorDomain: 'FINTECH' | 'HEALTH_TECH' | 'ED_TECH' | 'SAAS' | 'HARDWARE';
    fundingStage: 'PRE_SEED' | 'SEED' | 'SERIES_A' | 'STUDENT_GRANT';
    targetInvestmentUsd: number;
    pitchDeckUrl?: string;
    executiveSummary: string;
  }): Promise<IStudentVentureFund> {
    const venture = new StudentVentureFund({
      ...payload,
      committedInvestmentUsd: 0,
      investorCount: 0,
      investmentStatus: 'OPEN',
    });
    return await venture.save();
  }

  public static async getVentures(filters: VentureFilterQuery): Promise<IStudentVentureFund[]> {
    const query: any = {};
    if (filters.campusName && filters.campusName !== 'All') {
      query.campusName = filters.campusName;
    }
    if (filters.sectorDomain && filters.sectorDomain !== 'All') {
      query.sectorDomain = filters.sectorDomain;
    }
    if (filters.fundingStage && filters.fundingStage !== 'All') {
      query.fundingStage = filters.fundingStage;
    }
    if (filters.search && filters.search.trim() !== '') {
      query.$or = [
        { startupName: { $regex: filters.search, $options: 'i' } },
        { studentFounderName: { $regex: filters.search, $options: 'i' } },
        { campusName: { $regex: filters.search, $options: 'i' } },
      ];
    }
    return await StudentVentureFund.find(query).sort({ createdAt: -1 });
  }

  public static async commitInvestment(
    ventureId: string,
    investmentAmountUsd: number
  ): Promise<IStudentVentureFund | null> {
    const venture = await StudentVentureFund.findById(ventureId);
    if (!venture) return null;

    const newCommitted = venture.committedInvestmentUsd + investmentAmountUsd;
    const newCount = venture.investorCount + 1;
    const newStatus = newCommitted >= venture.targetInvestmentUsd ? 'FULLY_COMMITTED' : 'DUE_DILIGENCE';

    return await StudentVentureFund.findByIdAndUpdate(
      ventureId,
      {
        committedInvestmentUsd: newCommitted,
        investorCount: newCount,
        investmentStatus: newStatus,
      },
      { new: true }
    );
  }
}
