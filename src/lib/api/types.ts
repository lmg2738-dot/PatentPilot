export type DataSource = "live" | "mock";

export interface ApiResult<T> {
  data: T;
  source: DataSource;
  message?: string;
}

export interface DataSourcesMeta {
  patents: DataSource;
  ntis: DataSource;
  market: DataSource;
  policies: DataSource;
  analysis: DataSource;
}
