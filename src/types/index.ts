export type PlanType = "starter" | "pro" | "business";

export interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  plan: PlanType;
  search_count: number;
  search_limit: number;
  created_at: string;
}

export interface PatentResult {
  applicationNumber: string;
  title: string;
  applicant: string;
  applicationDate: string;
  registrationStatus: string;
  ipc: string;
  abstract: string;
}

export interface MarketData {
  marketName: string;
  marketSize: string;
  growthRate: string;
  year: string;
  source: string;
}

export interface AnalysisResult {
  patentabilityScore: number;
  similarPatentCount: number;
  similarPatents: PatentResult[];
  competitors: string[];
  differentiationStrategy: string;
  marketPotential: {
    marketSize: string;
    growthRate: string;
    summary: string;
  };
  governmentSupport: string[];
  risks: string[];
  recommendedActions: string[];
  technicalDifficulty: string;
  recommendedBM: string;
  developmentPeriod: string;
  investmentPotential: string;
  fullReport: string;
}

export interface SearchHistory {
  id: string;
  user_id: string;
  query: string;
  analysis?: AnalysisResult;
  created_at: string;
}

export interface Favorite {
  id: string;
  user_id: string;
  query: string;
  notes?: string;
  created_at: string;
}

export interface AlertConfig {
  id: string;
  user_id: string;
  competitor_name: string;
  ipc_codes?: string[];
  keywords?: string[];
  notify_email: boolean;
  notify_slack: boolean;
  is_active: boolean;
  created_at: string;
}

export interface DashboardStats {
  totalSearches: number;
  favoritesCount: number;
  activeAlerts: number;
  recentSearches: SearchHistory[];
}
