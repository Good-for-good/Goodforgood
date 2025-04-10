import { db } from '@/lib/firebase';
import { collection, addDoc, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';

interface WordPressPost {
  id: number;
  title: { rendered: string };
  content: { rendered: string };
  date: string;
  modified: string;
  slug: string;
  // Add more fields as needed
}

export async function syncWordPressData(wpUrl: string) {
  try {
    // Fetch WordPress posts
    const response = await fetch(`${wpUrl}/posts?_embed&per_page=100`);
    const posts: WordPressPost[] = await response.json();

    // Get Firestore collection reference
    const postsRef = collection(db, 'wordpress_posts');

    for (const post of posts) {
      // Check if post already exists
      const q = query(postsRef, where('wp_id', '==', post.id));
      const querySnapshot = await getDocs(q);

      const postData = {
        wp_id: post.id,
        title: post.title.rendered,
        content: post.content.rendered,
        date: post.date,
        last_modified: post.modified,
        slug: post.slug,
        synced_at: new Date().toISOString(),
      };

      if (querySnapshot.empty) {
        // Add new post
        await addDoc(postsRef, postData);
        console.log(`Added new post: ${post.title.rendered}`);
      } else {
        // Update existing post
        const docRef = doc(db, 'wordpress_posts', querySnapshot.docs[0].id);
        await updateDoc(docRef, postData);
        console.log(`Updated post: ${post.title.rendered}`);
      }
    }

    return {
      success: true,
      message: `Synced ${posts.length} posts successfully`,
    };
  } catch (error) {
    console.error('Sync Error:', error);
    return {
      success: false,
      error: 'Failed to sync WordPress data',
    };
  }
} 