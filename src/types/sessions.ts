export interface SessionStatus {
  inProgress: boolean,
  isCompleted: boolean,
  summary: string,
}

export enum SessionType {
  Export = "export",
  Import = "import"
}

export interface FileServiceSession {
  type?: "import" | "export",
  status?: "in progress" | "completed",
  conceptEntryNumber?: number;
  conceptEntryCount?: number;
  data?: string;
  error?: string;
  errorCode?: number;
}