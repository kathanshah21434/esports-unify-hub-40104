import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit2, Trash2, Megaphone, AlertTriangle, Info, AlertCircle, Zap, Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface Announcement {
  id: string;
  title: string;
  content: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const AnnouncementsTab: React.FC = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    priority: 'normal' as 'low' | 'normal' | 'high' | 'urgent',
    is_active: true
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAnnouncements((data || []) as Announcement[]);
    } catch (error) {
      console.error('Error fetching announcements:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch announcements',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.content.trim()) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields',
        variant: 'destructive'
      });
      return;
    }

    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        toast({
          title: 'Error',
          description: 'You must be logged in to create announcements',
          variant: 'destructive'
        });
        return;
      }

      if (editingId) {
        const { error } = await supabase
          .from('announcements')
          .update({
            title: formData.title.trim(),
            content: formData.content.trim(),
            priority: formData.priority,
            is_active: formData.is_active
          })
          .eq('id', editingId);

        if (error) throw error;
        
        toast({
          title: 'Success',
          description: 'Announcement updated successfully'
        });
      } else {
        const { error } = await supabase
          .from('announcements')
          .insert({
            title: formData.title.trim(),
            content: formData.content.trim(),
            priority: formData.priority,
            is_active: formData.is_active,
            created_by: userData.user.id
          });

        if (error) throw error;
        
        toast({
          title: 'Success',
          description: 'Announcement created successfully'
        });
      }

      resetForm();
      fetchAnnouncements();
    } catch (error) {
      console.error('Error saving announcement:', error);
      toast({
        title: 'Error',
        description: 'Failed to save announcement',
        variant: 'destructive'
      });
    }
  };

  const handleEdit = (announcement: Announcement) => {
    setFormData({
      title: announcement.title,
      content: announcement.content,
      priority: announcement.priority,
      is_active: announcement.is_active
    });
    setEditingId(announcement.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this announcement?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('announcements')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      toast({
        title: 'Success',
        description: 'Announcement deleted successfully'
      });
      
      fetchAnnouncements();
    } catch (error) {
      console.error('Error deleting announcement:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete announcement',
        variant: 'destructive'
      });
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
      priority: 'normal',
      is_active: true
    });
    setEditingId(null);
    setShowForm(false);
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'high':
        return <AlertCircle className="w-4 h-4 text-orange-500" />;
      case 'normal':
        return <Info className="w-4 h-4 text-blue-500" />;
      case 'low':
        return <Zap className="w-4 h-4 text-gray-400" />;
      default:
        return <Info className="w-4 h-4 text-blue-500" />;
    }
  };

  const getPriorityBadge = (priority: string) => {
    const styles = {
      urgent: 'announcement-badge-urgent',
      high: 'announcement-badge-high',
      normal: 'announcement-badge-normal',
      low: 'announcement-badge-low'
    };

    return (
      <Badge 
        variant="outline" 
        className={`${styles[priority as keyof typeof styles]} uppercase text-xs font-semibold animate-fade-in`}
      >
        {priority}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Megaphone className="w-6 h-6 text-primary" />
              <Sparkles className="w-3 h-3 text-primary absolute -top-1 -right-1 animate-pulse" />
            </div>
            <h2 className="text-2xl font-bold announcement-header-gradient">Manage Announcements</h2>
          </div>
        </div>
        <div className="text-center py-12">
          <div className="relative mx-auto w-16 h-16 mb-4">
            <div className="absolute inset-0 border-4 border-primary/20 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
          <p className="text-muted-foreground">Loading announcements...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Megaphone className="w-6 h-6 text-primary" />
            <Sparkles className="w-3 h-3 text-primary absolute -top-1 -right-1 animate-pulse" />
          </div>
          <h2 className="text-2xl font-bold announcement-header-gradient">Manage Announcements</h2>
        </div>
        <Button
          onClick={() => setShowForm(true)}
          className="bg-primary hover:bg-primary/90 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
          style={{ boxShadow: 'var(--glow-primary)' }}
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Announcement
        </Button>
      </div>

      {showForm && (
        <Card className="announcement-form animate-scale-in pulse-border">
          <CardHeader>
            <CardTitle className="text-foreground flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              {editingId ? 'Edit Announcement' : 'Create New Announcement'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title" className="text-foreground font-medium">Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Enter announcement title..."
                  className="bg-background/50 border-border/50 focus:border-primary/50 transition-colors"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="content" className="text-foreground font-medium">Content *</Label>
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="Enter announcement content..."
                  className="bg-background/50 border-border/50 focus:border-primary/50 transition-colors min-h-[120px] resize-none"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority" className="text-foreground font-medium">Priority</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value: 'low' | 'normal' | 'high' | 'urgent') => 
                    setFormData({ ...formData, priority: value })
                  }
                >
                  <SelectTrigger className="bg-background/50 border-border/50 focus:border-primary/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">🟢 Low Priority</SelectItem>
                    <SelectItem value="normal">🔵 Normal Priority</SelectItem>
                    <SelectItem value="high">🟠 High Priority</SelectItem>
                    <SelectItem value="urgent">🔴 Urgent Priority</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg bg-background/30 border border-border/50">
                <div className="space-y-1">
                  <Label htmlFor="is_active" className="text-foreground font-medium cursor-pointer">
                    Active Status
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    {formData.is_active ? 'Visible to all users' : 'Hidden from users'}
                  </p>
                </div>
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button 
                  type="submit" 
                  className="bg-primary hover:bg-primary/90 shadow-lg hover:shadow-xl transition-all duration-300 flex-1"
                  style={{ boxShadow: 'var(--glow-primary)' }}
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  {editingId ? 'Update' : 'Create'} Announcement
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={resetForm}
                  className="border-border/50 hover:bg-background/50"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        {announcements.length === 0 ? (
          <Card className="announcement-card text-center p-12 animate-fade-in">
            <div className="space-y-4">
              <div className="relative mx-auto w-16 h-16 mb-6">
                <Megaphone className="w-16 h-16 text-muted-foreground mx-auto" />
                <Sparkles className="w-6 h-6 text-primary absolute -top-2 -right-2 animate-bounce" />
              </div>
              <h3 className="text-xl font-semibold text-foreground">No Announcements Yet</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                Create your first announcement to start engaging with your community and sharing important updates.
              </p>
            </div>
          </Card>
        ) : (
          announcements.map((announcement, index) => (
            <Card 
              key={announcement.id} 
              className={`announcement-card announcement-card-${announcement.priority} animate-fade-in`}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="flex-shrink-0">
                      {getPriorityIcon(announcement.priority)}
                    </div>
                    <CardTitle className="text-foreground text-lg leading-tight font-semibold">
                      {announcement.title}
                    </CardTitle>
                    {getPriorityBadge(announcement.priority)}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant={announcement.is_active ? "default" : "secondary"}
                      className={announcement.is_active ? "bg-green-500/20 text-green-300 border-green-500/50" : ""}
                    >
                      {announcement.is_active ? '🟢 Active' : '⭕ Inactive'}
                    </Badge>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(announcement)}
                      className="text-primary border-primary/50 hover:bg-primary/10 transition-all duration-200 hover:scale-105"
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelete(announcement.id)}
                      className="text-destructive border-destructive/50 hover:bg-destructive/10 transition-all duration-200 hover:scale-105"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-foreground/90 whitespace-pre-wrap leading-relaxed">
                    {announcement.content}
                  </p>
                  <div className="text-sm text-muted-foreground pt-3 border-t border-border/50 flex flex-wrap gap-4">
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 bg-primary rounded-full"></span>
                      Created: {format(new Date(announcement.created_at), 'MMM dd, yyyy HH:mm')}
                    </span>
                    {announcement.updated_at !== announcement.created_at && (
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 bg-muted-foreground rounded-full"></span>
                        Updated: {format(new Date(announcement.updated_at), 'MMM dd, yyyy HH:mm')}
                      </span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default AnnouncementsTab;