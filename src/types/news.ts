export interface Article {
  title: string;
  subtitle?: string;
  body: string;
  category: string;
  tags?: string[];
  hidden?: boolean;
  createdAt: Date;
  updatedAt?: Date;
  createdBy: string;
  updatedBy?: string;
}
