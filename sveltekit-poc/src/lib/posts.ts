import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

const postsDirectory = path.join(process.cwd(), '..', 'posts');

export interface Post {
  id: string;
  title: string;
  date: string;
  content: string;
  notes: string[];
}

export interface PostMetadata {
  id: string;
  title: string;
  date: string;
}

/**
 * Get sorted list of all posts (metadata only)
 */
export function getSortedPostsData(): PostMetadata[] {
  const fileNames = fs.readdirSync(postsDirectory);

  const allPostsData = fileNames
    .filter(fileName => fileName.endsWith('.md'))
    .map((fileName) => {
      const id = fileName.replace(/\.md$/, '');
      const fullPath = path.join(postsDirectory, fileName);
      const fileContents = fs.readFileSync(fullPath, 'utf8');
      const matterResult = matter(fileContents);

      return {
        id,
        title: matterResult.data.title as string,
        date: matterResult.data.date as string,
      };
    });

  // Sort posts by date
  return allPostsData.sort((a, b) => {
    if (a.date < b.date) {
      return 1;
    } else {
      return -1;
    }
  });
}

/**
 * Get all post IDs for static path generation
 */
export function getAllPostIds(): string[] {
  const fileNames = fs.readdirSync(postsDirectory);
  return fileNames
    .filter(fileName => fileName.endsWith('.md'))
    .map((fileName) => fileName.replace(/\.md$/, ''));
}

/**
 * Get full post data including content
 */
export function getPostData(id: string): Post {
  const fullPath = path.join(postsDirectory, `${id}.md`);
  const fileContents = fs.readFileSync(fullPath, 'utf8');

  const matterResult = matter(fileContents);

  // Parse the notes from the content
  const notes = matterResult.content.split(' ').filter(note => note.length > 0);

  return {
    id,
    title: matterResult.data.title as string,
    date: matterResult.data.date as string,
    content: matterResult.content,
    notes
  };
}
