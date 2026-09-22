import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import readingTime from 'reading-time';
import { Post, PostMeta } from '@/types';

const postsDirectory = path.join(process.cwd(), 'content/blog');

export function getAllPosts(): PostMeta[] {
  if (!fs.existsSync(postsDirectory)) return [];

  const fileNames = fs.readdirSync(postsDirectory);
  const posts = fileNames
    .filter((file) => file.endsWith('.md'))
    .map((fileName) => {
      const slug = fileName.replace(/\.md$/, '');
      const fullPath = path.join(postsDirectory, fileName);
      const fileContents = fs.readFileSync(fullPath, 'utf8');
      const { data, content } = matter(fileContents);

      return {
        slug,
        title: data.title || 'Untitled Automation',
        excerpt: data.excerpt || 'Workflow blueprint & automated pipeline.',
        publishedAt: data.publishedAt || new Date().toISOString().split('T')[0],
        category: data.category || 'General Automation',
        author: data.author || 'AI Automation Team',
        tags: Array.isArray(data.tags) ? data.tags : [],
        workflowTool: data.workflowTool || 'Make.com',
        featured: Boolean(data.featured),
        readingTime: readingTime(content).text,
      } as PostMeta;
    });

  return posts.sort((a, b) => (new Date(b.publishedAt).getTime() > new Date(a.publishedAt).getTime() ? -1 : 1));
}

export function getPostBySlug(slug: string): Post | null {
  try {
    const fullPath = path.join(postsDirectory, `${slug}.md`);
    if (!fs.existsSync(fullPath)) return null;

    const fileContents = fs.readFileSync(fullPath, 'utf8');
    const { data, content } = matter(fileContents);

    return {
      meta: {
        slug,
        title: data.title || 'Untitled Automation',
        excerpt: data.excerpt || '',
        publishedAt: data.publishedAt || new Date().toISOString().split('T')[0],
        category: data.category || 'General Automation',
        author: data.author || 'AI Automation Team',
        tags: Array.isArray(data.tags) ? data.tags : [],
        workflowTool: data.workflowTool || 'Make.com',
        featured: Boolean(data.featured),
        readingTime: readingTime(content).text,
      },
      content,
    };
  } catch {
    return null;
  }
}
