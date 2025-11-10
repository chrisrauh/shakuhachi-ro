import { error } from '@sveltejs/kit';
import { getPostData, getAllPostIds } from '$lib/posts';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
  const validIds = getAllPostIds();

  if (!validIds.includes(params.id)) {
    throw error(404, 'Piece not found');
  }

  const post = getPostData(params.id);

  return {
    post
  };
};
