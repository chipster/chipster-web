import { NewsContents } from "./NewsContents";

export interface NewsItem {
  newsId?: string;
  created?: Date;
  modified?: Date;
  contents?: NewsContents;
}
