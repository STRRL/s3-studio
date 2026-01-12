export type AccessType = "PUBLIC" | "PRIVATE" | "LIFECYCLE";

export interface Bucket {
  id: string;
  name: string;
  region: string;
  access: AccessType;
  size: string;
  sizeBytes: number;
  createdAt: Date;
}
