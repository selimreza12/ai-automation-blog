export interface PostMeta {
  title: string;
  slug: string;
  excerpt: string;
  publishedAt: string;
  category: string;
  author: string;
  tags: string[];
  workflowTool?: string;
  featured?: boolean;
  readingTime: string;
}

export interface Post {
  meta: PostMeta;
  content: string;
}

export interface Tool {
  slug: string;
  name: string;
  category: string;
  description: string;
  affiliateUrl: string;
  bestFor: string;
  pricing: string;
}
