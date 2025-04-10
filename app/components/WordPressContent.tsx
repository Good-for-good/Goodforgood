'use client';

import React, { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';

interface WordPressPost {
  id: string;
  wp_id: number;
  title: string;
  content: string;
  date: string;
  last_modified: string;
  slug: string;
  synced_at: string;
}

export default function WordPressContent() {
  const [posts, setPosts] = useState<WordPressPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPosts() {
      try {
        const postsRef = collection(db, 'wordpress_posts');
        const q = query(postsRef, orderBy('date', 'desc'));
        const querySnapshot = await getDocs(q);
        
        const postsData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as WordPressPost[];

        setPosts(postsData);
        setError(null);
      } catch (err) {
        console.error('Error fetching WordPress posts:', err);
        setError('Failed to load WordPress content');
      } finally {
        setLoading(false);
      }
    }

    fetchPosts();
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading WordPress content...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">WordPress Content</h2>
      <div className="grid gap-6">
        {posts.map(post => (
          <article key={post.id} className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {post.title}
            </h3>
            <div className="text-sm text-gray-500 mb-4">
              <span>Published: {new Date(post.date).toLocaleDateString()}</span>
              <span className="mx-2">•</span>
              <span>Last modified: {new Date(post.last_modified).toLocaleDateString()}</span>
            </div>
            <div 
              className="prose max-w-none"
              dangerouslySetInnerHTML={{ __html: post.content }}
            />
            <div className="mt-4 text-sm text-gray-500">
              Last synced: {new Date(post.synced_at).toLocaleString()}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
} 