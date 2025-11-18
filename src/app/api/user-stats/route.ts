import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

interface NeynarUserResponse {
  users: Array<{
    fid: number;
    username: string;
    display_name: string;
    follower_count: number;
    following_count: number;
    pfp_url?: string;
  }>;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const fid = searchParams.get('fid');

  if (!fid) {
    return NextResponse.json(
      { error: 'FID parameter is required' },
      { status: 400 }
    );
  }

  const apiKey = process.env.NEYNAR_API_KEY || process.env.NEXT_PUBLIC_NEYNAR_API_KEY;

  if (!apiKey) {
    console.error('Neynar API key not configured');
    return NextResponse.json(
      { error: 'API configuration error' },
      { status: 500 }
    );
  }

  try {
    const response = await fetch(
      `https://api.neynar.com/v2/farcaster/user/bulk?fids=${fid}`,
      {
        headers: {
          'accept': 'application/json',
          'api_key': apiKey,
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Neynar API error:', response.status, errorText);
      return NextResponse.json(
        { error: 'Failed to fetch user data from Neynar' },
        { status: response.status }
      );
    }

    const data: NeynarUserResponse = await response.json();
    const user = data.users?.[0];

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      fid: user.fid,
      username: user.username,
      displayName: user.display_name || user.username,
      followerCount: user.follower_count || 0,
      followingCount: user.following_count || 0,
      pfpUrl: user.pfp_url,
    });
  } catch (error) {
    console.error('Error in user-stats API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}