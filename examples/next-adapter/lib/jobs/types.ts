export type JobStatus = 'queued' | 'running' | 'done' | 'error';

export type JobRow = {
  id: string;
  kind: string;
  status: JobStatus;
  payload: any;
  created_at?: string;
  updated_at?: string;
  started_at?: string | null;
  finished_at?: string | null;
  error?: string | null;
};

export type JobHandler = (job: JobRow) => Promise<void>;
