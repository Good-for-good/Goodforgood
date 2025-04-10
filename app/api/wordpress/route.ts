import { NextResponse } from 'next/server';

const WP_URL = process.env.WORDPRESS_URL || 'https://your-wordpress-site.com/wp-json/wp/v2';

export async function GET() {
  try {
    // Fetch posts
    const postsResponse = await fetch(`${WP_URL}/posts?_embed`);
    const posts = await postsResponse.json();

    // Fetch pages
    const pagesResponse = await fetch(`${WP_URL}/pages?_embed`);
    const pages = await pagesResponse.json();

    // You can add more endpoints as needed
    // const customResponse = await fetch(`${WP_URL}/custom-endpoint`);
    // const customData = await customResponse.json();

    return NextResponse.json({
      success: true,
      data: {
        posts,
        pages,
      }
    });
  } catch (error) {
    console.error('WordPress API Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch WordPress data' },
      { status: 500 }
    );
  }
} 