
export interface PortfolioFilters {
  status?: "draft" | "published" | "archived";
  templateId?: string;
  search?: string;
  sortBy?: "createdAt" | "updatedAt" | "viewCount" | "name";
  sortOrder?: "asc" | "desc";
  page?: number;
  limit?: number;
}

export interface PortfolioResponse {
  portfolios: unknown[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}