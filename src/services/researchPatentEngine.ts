import ResearchPatentIp, { IResearchPatentIp } from '../models/researchPatentSchema';

export interface PatentFilterQuery {
  campusName?: string;
  technologyDomain?: string;
  patentStatus?: string;
  search?: string;
}

export class ResearchPatentEngine {
  public static async registerPatent(payload: {
    patentTitle: string;
    campusName: string;
    leadInventorName: string;
    patentApplicationNumber: string;
    technologyDomain: 'ARTIFICIAL_INTELLIGENCE' | 'BIOTECH' | 'CLEANTECH' | 'QUANTUM' | 'SEMICONDUCTORS';
    licensingFeeUsd: number;
    royaltySharePercent: number;
    abstractDescription: string;
  }): Promise<IResearchPatentIp> {
    const patent = new ResearchPatentIp({
      ...payload,
      patentStatus: 'FILED',
    });
    return await patent.save();
  }

  public static async getPatents(filters: PatentFilterQuery): Promise<IResearchPatentIp[]> {
    const query: any = {};
    if (filters.campusName && filters.campusName !== 'All') {
      query.campusName = filters.campusName;
    }
    if (filters.technologyDomain && filters.technologyDomain !== 'All') {
      query.technologyDomain = filters.technologyDomain;
    }
    if (filters.patentStatus && filters.patentStatus !== 'All') {
      query.patentStatus = filters.patentStatus;
    }
    if (filters.search && filters.search.trim() !== '') {
      query.$or = [
        { patentTitle: { $regex: filters.search, $options: 'i' } },
        { leadInventorName: { $regex: filters.search, $options: 'i' } },
        { patentApplicationNumber: { $regex: filters.search, $options: 'i' } },
      ];
    }
    return await ResearchPatentIp.find(query).sort({ createdAt: -1 });
  }

  public static async executeLicensingAgreement(
    patentId: string,
    commercialPartnerName: string
  ): Promise<IResearchPatentIp | null> {
    return await ResearchPatentIp.findByIdAndUpdate(
      patentId,
      {
        commercialPartnerAssigned: commercialPartnerName,
        patentStatus: 'LICENSED',
      },
      { new: true }
    );
  }
}
