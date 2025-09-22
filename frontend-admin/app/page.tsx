"use client"

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  Activity,
  Shield,
  Settings,
  Database,
  Cpu,
  Globe,
  Target,
  Zap,
  Sparkles,
  ArrowRight,
  Eye,
  Clock,
  Star
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
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

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
      console.log('Fetched sentiment data:', result);
      setData(result);
      setLastRefresh(new Date());
    } catch (err) {
      console.error('Error fetching sentiment data:', err);
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800">
        <div className="container mx-auto px-6 py-8">
          <div className="flex items-center justify-center h-96">
            <div className="text-center space-y-4">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-full blur-2xl"></div>
                <div className="relative w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                  <RefreshCw className="h-8 w-8 text-white animate-spin" />
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">Loading Analytics</h3>
                <p className="text-slate-600 dark:text-slate-400">Gathering community insights...</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800">
        <div className="container mx-auto px-6 py-8">
          <div className="flex items-center justify-center h-96">
            <div className="text-center space-y-4">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-red-500/20 to-orange-500/20 rounded-full blur-2xl"></div>
                <div className="relative w-16 h-16 bg-gradient-to-r from-red-500 to-orange-500 rounded-full flex items-center justify-center">
                  <AlertTriangle className="h-8 w-8 text-white" />
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">Error Loading Data</h3>
                <p className="text-slate-600 dark:text-slate-400 mb-4">{error}</p>
                <Button onClick={() => fetchSentimentData()} className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Retry
                </Button>
              </div>
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

  // Calculate additional metrics
  const totalEngagement = overall_stats.total_posts + overall_stats.total_comments;
  const positivePercentage = totalEngagement > 0 ? 
    ((overall_stats.positive_posts + overall_stats.positive_comments) / totalEngagement * 100).toFixed(1) : 0;
  const negativePercentage = totalEngagement > 0 ? 
    ((overall_stats.negative_posts + overall_stats.negative_comments) / totalEngagement * 100).toFixed(1) : 0;

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

  // Admin stats
  const adminStats = [
    { 
      label: "Total Posts", 
      value: overall_stats.total_posts.toString(), 
      icon: MessageSquare, 
      color: "text-blue-600",
      change: "+12%",
      trend: "up"
    },
    { 
      label: "Total Comments", 
      value: overall_stats.total_comments.toString(), 
      icon: Users, 
      color: "text-purple-600",
      change: "+8%",
      trend: "up"
    },
    { 
      label: "Positive Sentiment", 
      value: `${positivePercentage}%`, 
      icon: Heart, 
      color: "text-green-600",
      change: "+5%",
      trend: "up"
    },
    { 
      label: "Active Topics", 
      value: Object.keys(tag_analysis).length.toString(), 
      icon: Target, 
      color: "text-orange-600",
      change: "+3",
      trend: "up"
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800">
      {/* Header */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-pink-500/5"></div>
        <div className="absolute top-20 left-10 w-32 h-32 bg-blue-400/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-40 right-20 w-24 h-24 bg-purple-400/20 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        
        <div className="container mx-auto px-6 py-8 relative z-10">
          <div className="flex items-center justify-between mb-8">
            <div className="space-y-2">
              <div className="flex items-center space-x-3 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-full px-6 py-3 w-fit border border-slate-200/50 dark:border-slate-700/50 shadow-lg">
                <Shield className="h-5 w-5 text-purple-600" />
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Admin Dashboard</span>
                <Zap className="h-5 w-5 text-blue-600" />
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-slate-800 dark:text-slate-200">
                Community Analytics
              </h1>
              <p className="text-xl text-slate-600 dark:text-slate-400">
                Real-time insights into community sentiment and engagement
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <Button 
                onClick={() => fetchSentimentData(true)}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh Data
              </Button>
              {lastRefresh && (
                <div className="text-sm text-slate-600 dark:text-slate-400">
                  Last updated: {lastRefresh.toLocaleTimeString()}
                </div>
              )}
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {adminStats.map((stat, index) => (
              <Card key={index} className="group hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 border-2 border-slate-200/50 dark:border-slate-700/50 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <div className={`w-12 h-12 bg-gradient-to-r ${stat.color.replace('text-', 'from-').replace('-600', '-500')} to-${stat.color.replace('text-', '').replace('-600', '-600')} rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                        <stat.icon className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-slate-800 dark:text-slate-200">{stat.value}</div>
                        <div className="text-sm text-slate-600 dark:text-slate-400 font-medium">{stat.label}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`flex items-center text-sm font-medium ${
                        stat.trend === 'up' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {stat.trend === 'up' ? <TrendingUp className="h-4 w-4 mr-1" /> : <TrendingDown className="h-4 w-4 mr-1" />}
                        {stat.change}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Sentiment Overview */}
            <Card className="border-2 border-slate-200/50 dark:border-slate-700/50 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-blue-600" />
                  Posts Sentiment Overview
                </CardTitle>
                <CardDescription>Distribution of sentiment across community posts</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
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
                </div>
              </CardContent>
            </Card>

            {/* Comments Sentiment */}
            <Card className="border-2 border-slate-200/50 dark:border-slate-700/50 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-purple-600" />
                  Comments Sentiment Overview
                </CardTitle>
                <CardDescription>Distribution of sentiment across comments</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
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
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tag Analysis */}
          {hasTagData && (
            <Card className="mb-8 border-2 border-slate-200/50 dark:border-slate-700/50 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-orange-600" />
                  Topic Analysis by Tags
                </CardTitle>
                <CardDescription>Sentiment distribution across different community topics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={tagData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="positive" stackId="a" fill="#10b981" />
                      <Bar dataKey="neutral" stackId="a" fill="#6b7280" />
                      <Bar dataKey="negative" stackId="a" fill="#ef4444" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recommendations */}
          <Card className="border-2 border-slate-200/50 dark:border-slate-700/50 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-yellow-600" />
                AI Recommendations
              </CardTitle>
              <CardDescription>Actionable insights for community improvement</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="prose dark:prose-invert max-w-none">
                <div className="whitespace-pre-line text-slate-700 dark:text-slate-300">
                  {recommendations}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 