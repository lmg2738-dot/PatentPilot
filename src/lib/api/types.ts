export type DataSource = "live" | "mock";

export interface ApiResult<T> {
  data: T;
  source: DataSource;
  message?: string;
}

export interface DataSourcesMeta {
  patents: DataSource;
  market: DataSource;
  analysis: DataSource;
}
