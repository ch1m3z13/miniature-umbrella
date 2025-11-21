'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import PostCard from './PostCard';
import FilterControls from './FilterControls';
import PostSkeleton from './PostSkeleton';
import EmptyState from './EmptyState';
import ToastNotification from './ToastNotification';
import BottomTabNavigation from '@/components/common/BottomTabNavigation';
import FloatingActionButton from '@/components/common/FloatingActionButton';
import { supabase } from '@/lib/supabase';
import { sdk } from '@farcaster/frame-sdk';

interface Post {
  id: string;
  content: string;
  projectName: string;
  projectImage: string;
  projectImageAlt: string;
  timestamp: string;
  likes: number;
  shares: number;
  status: 'pending' | 'approved' | 'rejected';
  platform: 'X' | 'Farcaster';
  projectId: string;
}

interface Project {
  id: string;
  name: string;
}

interface Toast {
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  isVisible: boolean;
}

interface UserStats {
  fid: number | null;
  username: string;
  followerCount: number;
  followingCount: number;
}

const DashboardInteractive = () => {
  const router = useRouter();
  const [isHydrated, setIsHydrated] = useState(false);
  const [posts, setPosts] = useState<Post[]>([]);
  const [filteredPosts, setFilteredPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [toast, setToast] = useState<Toast>({ message: '', type: 'info', isVisible: false });
  
  // Bead features
  const [userStats, setUserStats] = useState<UserStats>({
    fid: null,
    username: 'Guest',
    followerCount: 0,
    followingCount: 0
  });
  const [watchlist, setWatchlist] = useState<string[]>([]);
  const [dailySummary, setDailySummary] = useState<string>('');
  const [isSDKLoaded, setIsSDKLoaded] = useState(false);

  // Mock data
  const mockProjects: Project[] = [];

  const mockPosts: Post[] = [];

  // Initialize Farcaster SDK and fetch user data
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Initialize Farcaster SDK
        const context = await sdk.context;
        setIsSDKLoaded(true);

        if (context.user?.fid) {
          const userFid = context.user.fid;
          setUserStats(prev => ({
            ...prev,
            fid: userFid,
            username: context.user.username || `User ${userFid}`
          }));

          // Fetch user's watchlist and stats
          await Promise.all([
            fetchWatchlist(userFid),
            fetchUserStats(userFid),
            fetchDailySummary(userFid)
          ]);
        }

        sdk.actions.ready();
      } catch (error) {
        console.error('Failed to initialize Farcaster SDK:', error);
        // Continue with mock data
      }
    };

    initializeApp();
  }, []);

  // Fetch watchlist from Supabase
  const fetchWatchlist = async (userFid: number) => {
    try {
      const { data, error } = await supabase
        .from('watchlists')
        .select('project')
        .eq('fid', userFid)
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data) {
        setWatchlist(data.map((item: { project: string }) => item.project));
      }
    } catch (error) {
      console.error('Error fetching watchlist:', error);
      showToast('Failed to load watchlist', 'error');
    }
  };

  // Fetch user stats from API route
  const fetchUserStats = async (userFid: number) => {
    try {
      const response = await fetch(`/api/user-stats?fid=${userFid}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch user stats');
      }
      
      const stats = await response.json();
      
      setUserStats(prev => ({
        ...prev,
        followerCount: stats.followerCount,
        followingCount: stats.followingCount,
        username: stats.username || prev.username
      }));
    } catch (error) {
      console.error('Error fetching user stats:', error);
      showToast('Could not load follower stats', 'warning');
    }
  };

  // Fetch daily summary
  const fetchDailySummary = async (userFid: number) => {
    try {
      const { data, error } = await supabase
        .from('daily_summaries')
        .select('summary')
        .eq('fid', userFid)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      if (data) {
        setDailySummary(data.summary);
      }
    } catch (error) {
      console.error('Error fetching daily summary:', error);
    }
  };

  useEffect(() => {
    setIsHydrated(true);
    // Fetch real posts from watchlist projects
    const fetchPosts = async () => {
      if (watchlist.length === 0) {
        setIsLoading(false);
        return;
      }

      try {
        // TODO: Implement actual API call to fetch posts from tracked projects
        // For now, we'll show empty state
        setPosts([]);
      } catch (error) {
        console.error('Error fetching posts:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (watchlist.length > 0) {
      fetchPosts();
    } else {
      setIsLoading(false);
    }
  }, [watchlist]);

  // Filter and sort posts
  useEffect(() => {
    if (!isHydrated) return;

    let filtered = [...posts];

    // Filter by project
    if (selectedProject !== 'all') {
      filtered = filtered.filter((post) => post.projectId === selectedProject);
    }

    // Filter by status
    if (selectedStatus !== 'all') {
      filtered = filtered.filter((post) => post.status === selectedStatus);
    }

    // Sort posts
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'oldest':
          return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
        case 'most-liked':
          return b.likes - a.likes;
        case 'most-shared':
          return b.shares - a.shares;
        case 'newest':
        default:
          return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      }
    });

    setFilteredPosts(filtered);
  }, [posts, selectedProject, selectedStatus, sortBy, isHydrated]);

  const showToast = useCallback((message: string, type: Toast['type']) => {
    setToast({ message, type, isVisible: true });
  }, []);

  const hideToast = useCallback(() => {
    setToast((prev) => ({ ...prev, isVisible: false }));
  }, []);

  const handleLike = useCallback((postId: string) => {
    setPosts((prev) => prev.map((post) =>
      post.id === postId ? { ...post, likes: post.likes + 1 } : post
    ));
    showToast('Post liked!', 'success');
  }, [showToast]);

  const handleShare = useCallback((postId: string) => {
    setPosts((prev) => prev.map((post) =>
      post.id === postId ? { ...post, shares: post.shares + 1 } : post
    ));
    showToast('Post shared successfully!', 'success');
  }, [showToast]);

  const handleApprove = useCallback((postId: string) => {
    setPosts((prev) => prev.map((post) =>
      post.id === postId ? { ...post, status: 'approved' as const } : post
    ));
    showToast('Post approved for publishing!', 'success');
  }, [showToast]);

  const handleReject = useCallback((postId: string) => {
    setPosts((prev) => prev.map((post) =>
      post.id === postId ? { ...post, status: 'rejected' as const } : post
    ));
    showToast('Post rejected', 'warning');
  }, [showToast]);

  const handleRegenerate = useCallback((postId: string) => {
    showToast('Regenerating post with AI...', 'info');
    setTimeout(() => {
      showToast('New post generated successfully!', 'success');
    }, 2000);
  }, [showToast]);

  if (!isHydrated) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-6 pb-20">
          <div className="space-y-6">
            {[...Array(3)].map((_, i) => <PostSkeleton key={i} />)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto px-4 py-6 pb-20 max-w-full">
        {/* User Stats Header */}
        <div className="bg-card rounded-xl p-4 mb-6 shadow-subtle border border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center font-bold text-white">
                {userStats.username.charAt(0).toUpperCase()}
              </div>
              <div>
                <h2 className="font-semibold text-foreground">{userStats.username}</h2>
                <p className="text-sm text-muted-foreground">
                  {userStats.followerCount} followers · {userStats.followingCount} following
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-muted-foreground">Tracking</div>
              <div className="text-2xl font-bold text-primary">{watchlist.length}</div>
            </div>
          </div>
        </div>

        {/* Daily Summary */}
        {dailySummary && (
          <div className="bg-accent/10 border border-accent/20 rounded-xl p-4 mb-6">
            <h3 className="text-sm font-semibold text-accent mb-2">📊 Today's Summary</h3>
            <p className="text-sm text-foreground">{dailySummary}</p>
          </div>
        )}

        {/* Watchlist Preview */}
        {watchlist.length > 0 && (
          <div className="bg-card rounded-xl p-4 mb-6 shadow-subtle border border-border">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-foreground">Your Watchlist</h3>
              <button
                onClick={() => router.push('/add-project')}
                className="text-sm text-primary hover:text-primary/80 transition"
              >
                View All →
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {watchlist.slice(0, 5).map((project, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1 bg-muted rounded-full text-sm text-muted-foreground"
                >
                  {project}
                </span>
              ))}
              {watchlist.length > 5 && (
                <span className="px-3 py-1 bg-muted rounded-full text-sm text-muted-foreground">
                  +{watchlist.length - 5} more
                </span>
              )}
            </div>
          </div>
        )}

        {/* Filters - Collapsible */}
        {showFilters && (
          <div className="mb-6">
            <FilterControls
              selectedProject={selectedProject}
              selectedStatus={selectedStatus}
              sortBy={sortBy}
              onProjectChange={setSelectedProject}
              onStatusChange={setSelectedStatus}
              onSortChange={setSortBy}
              projects={mockProjects}
            />
          </div>
        )}

        {/* Toggle Filters Button */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="mb-4 text-sm text-primary hover:text-primary/80 transition flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          {showFilters ? 'Hide Filters' : 'Show Filters'}
        </button>

        {isLoading ? (
          <div className="space-y-6">
            {[...Array(3)].map((_, i) => <PostSkeleton key={i} />)}
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="bg-card rounded-xl p-8 text-center border border-border">
            <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-foreground mb-2">No Posts Yet</h3>
            <p className="text-muted-foreground mb-6">
              {watchlist.length === 0 
                ? "Start tracking projects to see AI-generated posts here" 
                : "Posts from your tracked projects will appear here"}
            </p>
            <button
              onClick={() => router.push('/add-project')}
              className="bg-gradient-to-r from-primary to-secondary text-white px-6 py-3 rounded-lg font-semibold hover:opacity-90 transition"
            >
              {watchlist.length === 0 ? 'Add Your First Project' : 'Add More Projects'}
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredPosts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                onLike={handleLike}
                onShare={handleShare}
                onApprove={handleApprove}
                onReject={handleReject}
                onRegenerate={handleRegenerate}
              />
            ))}
          </div>
        )}
      </div>

      <FloatingActionButton />
      <BottomTabNavigation />
      
      <ToastNotification
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={hideToast}
      />
    </div>
  );
};

export default DashboardInteractive;