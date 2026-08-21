import AlumniEndowmentFund, { IAlumniEndowmentFund } from '../models/alumniEndowmentSchema';

export interface EndowmentFilterQuery {
  campusName?: string;
  fundCategory?: string;
  grantStatus?: string;
  search?: string;
}

export class AlumniEndowmentEngine {
  public static async createEndowment(payload: {
    fundName: string;
    campusName: string;
    donorName: string;
    donorAlumniBatchYear: number;
    fundCategory: 'RESEARCH_GRANT' | 'STUDENT_SCHOLARSHIP' | 'LAB_EQUIPMENT' | 'HACKATHON_SPONSORSHIP';
    targetAmountUsd: number;
    initialContributionUsd: number;
    matchingGrantEnabled: boolean;
    matchingRatio?: number;
    description: string;
  }): Promise<IAlumniEndowmentFund> {
    const matchingRatio = payload.matchingGrantEnabled ? payload.matchingRatio || 1.5 : 1.0;
    const effectiveContribution = payload.matchingGrantEnabled
      ? payload.initialContributionUsd * matchingRatio
      : payload.initialContributionUsd;

    const fund = new AlumniEndowmentFund({
      ...payload,
      currentAmountRaisedUsd: effectiveContribution,
      totalDonorsCount: 1,
      grantStatus: effectiveContribution >= payload.targetAmountUsd ? 'FULLY_FUNDED' : 'ACTIVE',
      matchingRatio,
    });

    return await fund.save();
  }

  public static async getEndowments(filters: EndowmentFilterQuery): Promise<IAlumniEndowmentFund[]> {
    const query: any = {};
    if (filters.campusName && filters.campusName !== 'All') {
      query.campusName = filters.campusName;
    }
    if (filters.fundCategory && filters.fundCategory !== 'All') {
      query.fundCategory = filters.fundCategory;
    }
    if (filters.grantStatus && filters.grantStatus !== 'All') {
      query.grantStatus = filters.grantStatus;
    }
    if (filters.search && filters.search.trim() !== '') {
      query.$or = [
        { fundName: { $regex: filters.search, $options: 'i' } },
        { donorName: { $regex: filters.search, $options: 'i' } },
        { campusName: { $regex: filters.search, $options: 'i' } },
      ];
    }
    return await AlumniEndowmentFund.find(query).sort({ createdAt: -1 });
  }

  public static async contributeToFund(
    fundId: string,
    donationAmountUsd: number
  ): Promise<IAlumniEndowmentFund | null> {
    const fund = await AlumniEndowmentFund.findById(fundId);
    if (!fund) return null;

    const addedValue = fund.matchingGrantEnabled
      ? donationAmountUsd * fund.matchingRatio
      : donationAmountUsd;

    const newRaised = fund.currentAmountRaisedUsd + addedValue;
    const newCount = fund.totalDonorsCount + 1;
    const newStatus = newRaised >= fund.targetAmountUsd ? 'FULLY_FUNDED' : fund.grantStatus;

    return await AlumniEndowmentFund.findByIdAndUpdate(
      fundId,
      {
        currentAmountRaisedUsd: newRaised,
        totalDonorsCount: newCount,
        grantStatus: newStatus,
      },
      { new: true }
    );
  }
}
