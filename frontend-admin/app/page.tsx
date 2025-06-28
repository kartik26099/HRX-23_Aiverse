"use client"

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  MessageSquare, 
  Heart, 
  AlertTriangle,
  RefreshCw,
  BarChart3,
  PieChart as PieChartIcon,
  Activity
} from 'lucide-react';

interface SentimentData {
  sentiment_data: {
    overall_stats: {
      total_posts: number;
      total_comments: number;
      positive_posts: number;
      negative_posts: number;
      neutral_posts: number;
      positive_comments: number;
      negative_comments: number;
      neutral_comments: number;
    };
    posts_sentiment: Array<{
      post_id: string;
      content: string;
      sentiment: string;
      user: string;
      created_at: string;
      type: string;
      reaction_count: number;
      comment_count: number;
    }>;
    comments_sentiment: Array<{
      comment_id: string;
      post_id: string;
      content: string;
      sentiment: string;
      user: string;
      created_at: string;
    }>;
    tag_analysis: Record<string, {
      total_posts: number;
      positive: number;
      negative: number;
      neutral: number;
    }>;
  };
  recommendations: string;
  timestamp: string;
}

export default function AdminDashboard() {
  const [data, setData] = useState<SentimentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSentimentData = async (forceRefresh = false) => {
    try {
      setLoading(true);
      setError(null);
      
      const url = forceRefresh 
        ? '/api/sentiment/sentiment-analysis?force_refresh=true'
        : '/api/sentiment/sentiment-analysis';
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch sentiment data: ${response.status} ${response.statusText}`);
      }
      
      const result = await response.json();
      console.log('Fetched sentiment data:', result); // Debug log
      setData(result);
    } catch (err) {
      console.error('Error fetching sentiment data:', err); // Debug log
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSentimentData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <div className="container mx-auto px-6 py-8">
          <div className="flex items-center justify-center h-96">
            <div className="flex items-center space-x-2">
              <RefreshCw className="h-6 w-6 animate-spin" />
              <span>Loading sentiment analysis...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <div className="container mx-auto px-6 py-8">
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Error Loading Data</h2>
              <p className="text-gray-600 mb-4">{error}</p>
              <Button onClick={fetchSentimentData}>Retry</Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const { sentiment_data, recommendations } = data;
  const { overall_stats, tag_analysis } = sentiment_data;

  // Prepare chart data
  const postsSentimentData = [
    { name: 'Positive', value: overall_stats.positive_posts, color: '#10b981' },
    { name: 'Neutral', value: overall_stats.neutral_posts, color: '#6b7280' },
    { name: 'Negative', value: overall_stats.negative_posts, color: '#ef4444' },
  ];

  const commentsSentimentData = [
    { name: 'Positive', value: overall_stats.positive_comments, color: '#10b981' },
    { name: 'Neutral', value: overall_stats.neutral_comments, color: '#6b7280' },
    { name: 'Negative', value: overall_stats.negative_comments, color: '#ef4444' },
  ];

  const tagData = Object.entries(tag_analysis).map(([tag, stats]) => ({
    name: tag,
    positive: stats.positive,
    negative: stats.negative,
    neutral: stats.neutral,
    total: stats.total_posts,
  }));

  console.log('Tag data for chart:', tagData); // Debug log

  // Handle empty tag data
  const hasTagData = tagData.length > 0 && tagData.some(tag => tag.total > 0);

  const timeSeriesData = sentiment_data.posts_sentiment
    .map(post => ({
      date: new Date(post.created_at).toLocaleDateString(),
      sentiment: post.sentiment === 'POSITIVE' ? 1 : post.sentiment === 'NEGATIVE' ? -1 : 0,
    }))
    .reduce((acc, curr) => {
      const existing = acc.find(item => item.date === curr.date);
      if (existing) {
        existing.sentiment += curr.sentiment;
      } else {
        acc.push(curr);
      }
      return acc;
    }, [] as Array<{ date: string; sentiment: number }>)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                Community Analytics Dashboard
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Real-time sentiment analysis and community insights
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Button onClick={() => fetchSentimentData(false)} className="flex items-center space-x-2">
                <RefreshCw className="h-4 w-4" />
                <span>Refresh Data</span>
              </Button>
              <Button 
                onClick={() => fetchSentimentData(true)} 
                variant="outline" 
                className="flex items-center space-x-2"
              >
                <RefreshCw className="h-4 w-4" />
                <span>Force Refresh</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Posts</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{overall_stats.total_posts}</div>
              <p className="text-xs text-muted-foreground">
                +{overall_stats.positive_posts} positive, {overall_stats.negative_posts} negative
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Comments</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{overall_stats.total_comments}</div>
              <p className="text-xs text-muted-foreground">
                +{overall_stats.positive_comments} positive, {overall_stats.negative_comments} negative
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Positive Sentiment</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {((overall_stats.positive_posts + overall_stats.positive_comments) / 
                  (overall_stats.total_posts + overall_stats.total_comments) * 100).toFixed(1)}%
              </div>
              <p className="text-xs text-muted-foreground">
                Across posts and comments
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Negative Sentiment</CardTitle>
              <TrendingDown className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {((overall_stats.negative_posts + overall_stats.negative_comments) / 
                  (overall_stats.total_posts + overall_stats.total_comments) * 100).toFixed(1)}%
              </div>
              <p className="text-xs text-muted-foreground">
                Requires attention
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Posts Sentiment Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BarChart3 className="h-5 w-5" />
                <span>Posts Sentiment Distribution</span>
              </CardTitle>
              <CardDescription>Breakdown of post sentiments</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={postsSentimentData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {postsSentimentData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Comments Sentiment Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <PieChartIcon className="h-5 w-5" />
                <span>Comments Sentiment Distribution</span>
              </CardTitle>
              <CardDescription>Breakdown of comment sentiments</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={commentsSentimentData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {commentsSentimentData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Tag Analysis */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Activity className="h-5 w-5" />
              <span>Tag Sentiment Analysis</span>
            </CardTitle>
            <CardDescription>Sentiment breakdown by community tags</CardDescription>
          </CardHeader>
          <CardContent>
            {hasTagData ? (
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={tagData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="positive" fill="#10b981" name="Positive" />
                  <Bar dataKey="neutral" fill="#6b7280" name="Neutral" />
                  <Bar dataKey="negative" fill="#ef4444" name="Negative" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-64 text-gray-500">
                <div className="text-center">
                  <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No tag data available</p>
                  <p className="text-sm">Posts need to be tagged to show sentiment analysis</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Time Series Sentiment */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5" />
              <span>Sentiment Over Time</span>
            </CardTitle>
            <CardDescription>Community sentiment trends</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={timeSeriesData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Area 
                  type="monotone" 
                  dataKey="sentiment" 
                  stroke="#3b82f6" 
                  fill="#3b82f6" 
                  fillOpacity={0.3}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Recommendations */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Heart className="h-5 w-5" />
              <span>AI Recommendations</span>
            </CardTitle>
            <CardDescription>Actionable insights to improve community engagement</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm max-w-none">
              <div className="whitespace-pre-line text-gray-700 dark:text-gray-300">
                {recommendations}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 