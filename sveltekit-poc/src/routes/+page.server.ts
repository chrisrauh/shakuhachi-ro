import { getSortedPostsData } from '$lib/posts';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
  const allPostsData = getSortedPostsData();

  return {
    posts: allPostsData
  };
};
