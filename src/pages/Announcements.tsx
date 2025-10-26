import React, { useState, useEffect } from 'react';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Megaphone, Calendar, AlertTriangle, Info, AlertCircle, Zap, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

interface Announcement {
  id: string;
  title: string;
  content: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  created_at: string;
  updated_at: string;
}

const Announcements: React.FC = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAnnouncements((data || []) as Announcement[]);
    } catch (error) {
      console.error('Error fetching announcements:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return <AlertTriangle className="w-5 h-5 text-red-500" />;
      case 'high':
        return <AlertCircle className="w-5 h-5 text-orange-500" />;
      case 'normal':
        return <Info className="w-5 h-5 text-blue-500" />;
      case 'low':
        return <Zap className="w-5 h-5 text-gray-400" />;
      default:
        return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  const getPriorityBadge = (priority: string) => {
    const styles = {
      urgent: 'bg-red-500/20 text-red-300 border-red-500/50',
      high: 'bg-orange-500/20 text-orange-300 border-orange-500/50',
      normal: 'bg-blue-500/20 text-blue-300 border-blue-500/50',
      low: 'bg-gray-500/20 text-gray-300 border-gray-500/50'
    };

    return (
      <Badge 
        variant="outline" 
        className={`${styles[priority as keyof typeof styles]} uppercase text-xs font-semibold`}
      >
        {priority}
      </Badge>
    );
  };

  const getPriorityOrder = (priority: string) => {
    const order = { urgent: 0, high: 1, normal: 2, low: 3 };
    return order[priority as keyof typeof order] || 2;
  };

  const sortedAnnouncements = announcements.sort((a, b) => {
    const priorityA = getPriorityOrder(a.priority);
    const priorityB = getPriorityOrder(b.priority);
    if (priorityA !== priorityB) {
      return priorityA - priorityB;
    }
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  if (loading) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex justify-center items-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
            <span className="ml-2 text-gray-400">Loading announcements...</span>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-8 md:mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Megaphone className="w-6 md:w-8 h-6 md:h-8 text-purple-400" />
            <h1 className="text-2xl md:text-4xl font-bold text-white">Announcements</h1>
          </div>
          <p className="text-gray-400 text-base md:text-lg max-w-2xl mx-auto px-4">
            Stay updated with the latest news, tournament updates, and important information from our esports platform.
          </p>
        </div>

        {/* Announcements List */}
        <div className="space-y-6">
          {sortedAnnouncements.length === 0 ? (
            <Card className="bg-gray-800 border-gray-700 text-center p-12">
              <div className="space-y-4">
                <Megaphone className="w-16 h-16 text-gray-600 mx-auto" />
                <div className="space-y-2">
                  <h3 className="text-xl font-semibold text-gray-400">No Announcements Yet</h3>
                  <p className="text-gray-500 max-w-md mx-auto">
                    Check back soon for the latest updates, tournament news, and important platform announcements!
                  </p>
                </div>
              </div>
            </Card>
          ) : (
            sortedAnnouncements.map((announcement) => (
              <Card 
                key={announcement.id} 
                className="bg-gray-800 border-gray-700 hover:border-purple-500/50 transition-all duration-300"
              >
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      <div className="flex-shrink-0 mt-1">
                        {getPriorityIcon(announcement.priority)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <CardTitle className="text-white text-xl leading-tight font-bold">
                          {announcement.title}
                        </CardTitle>
                      </div>
                    </div>
                    <div className="flex-shrink-0">
                      {getPriorityBadge(announcement.priority)}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-gray-300 leading-relaxed whitespace-pre-wrap">
                    {announcement.content}
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-gray-400 pt-4 border-t border-gray-700">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-purple-400" />
                      <span>
                        Published {format(new Date(announcement.created_at), 'MMM dd, yyyy')}
                        <span className="hidden sm:inline"> at {format(new Date(announcement.created_at), 'HH:mm')}</span>
                      </span>
                    </div>
                    {announcement.updated_at !== announcement.created_at && (
                      <div className="flex items-center gap-2">
                        <span className="w-1 h-1 bg-gray-400 rounded-full hidden sm:block"></span>
                        <span className="text-gray-500">
                          Updated {format(new Date(announcement.updated_at), 'MMM dd, yyyy')}
                        </span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

      </div>
    </Layout>
  );
};

export default Announcements;