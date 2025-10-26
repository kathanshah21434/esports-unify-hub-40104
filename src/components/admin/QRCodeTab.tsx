import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { qrCodeService, QRCode } from '@/services/qrCodeService';
import { FileUpload } from '@/components/ui/file-upload';
import { QrCode, Edit, Trash2, Plus, Eye, Download } from 'lucide-react';

export const QRCodeTab = () => {
  const { toast } = useToast();
  const [qrCodes, setQRCodes] = useState<QRCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingQRCode, setEditingQRCode] = useState<QRCode | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    image_url: '',
    is_active: false
  });

  useEffect(() => {
    loadQRCodes();
  }, []);

  const loadQRCodes = async () => {
    try {
      const data = await qrCodeService.getAllQRCodes();
      setQRCodes(data);
    } catch (error) {
      console.error('Failed to load QR codes:', error);
      toast({
        title: "Error",
        description: "Failed to load QR codes. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.image_url) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields and upload an image.",
        variant: "destructive",
      });
      return;
    }

    try {
      if (editingQRCode) {
        await qrCodeService.updateQRCode(editingQRCode.id, formData);
        toast({
          title: "Success",
          description: "QR code updated successfully.",
        });
      } else {
        await qrCodeService.createQRCode(formData);
        toast({
          title: "Success",
          description: "QR code created successfully.",
        });
      }

      setIsDialogOpen(false);
      resetForm();
      loadQRCodes();
    } catch (error) {
      console.error('Failed to save QR code:', error);
      toast({
        title: "Error",
        description: "Failed to save QR code. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (qrCode: QRCode) => {
    setEditingQRCode(qrCode);
    setFormData({
      name: qrCode.name,
      description: qrCode.description || '',
      image_url: qrCode.image_url,
      is_active: qrCode.is_active
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this QR code?')) return;

    try {
      await qrCodeService.deleteQRCode(id);
      toast({
        title: "Success",
        description: "QR code deleted successfully.",
      });
      loadQRCodes();
    } catch (error) {
      console.error('Failed to delete QR code:', error);
      toast({
        title: "Error",
        description: "Failed to delete QR code. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleToggleActive = async (id: string, isActive: boolean) => {
    try {
      if (isActive) {
        await qrCodeService.setActiveQRCode(id);
        toast({
          title: "Success",
          description: "QR code activated successfully.",
        });
      } else {
        await qrCodeService.updateQRCode(id, { is_active: false });
        toast({
          title: "Success",
          description: "QR code deactivated successfully.",
        });
      }
      loadQRCodes();
    } catch (error) {
      console.error('Failed to toggle QR code status:', error);
      toast({
        title: "Error",
        description: "Failed to update QR code status. Please try again.",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      image_url: '',
      is_active: false
    });
    setEditingQRCode(null);
  };

  const openCreateDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const downloadQRCode = async (imageUrl: string, name: string) => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${name.replace(/\s+/g, '_')}_QR_Code.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast({
        title: "Success",
        description: "QR code downloaded successfully.",
      });
    } catch (error) {
      console.error('Failed to download QR code:', error);
      toast({
        title: "Error",
        description: "Failed to download QR code. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return <div className="text-white">Loading QR codes...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium text-white">QR Code Management</h3>
          <p className="text-gray-400 text-sm">Manage payment QR codes displayed on the website</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreateDialog} className="bg-purple-600 hover:bg-purple-700">
              <Plus className="w-4 h-4 mr-2" />
              Add QR Code
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-gray-800 border-gray-600">
            <DialogHeader>
              <DialogTitle className="text-white">
                {editingQRCode ? 'Edit QR Code' : 'Add New QR Code'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name" className="text-white">Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="bg-gray-700 border-gray-600 text-white"
                  placeholder="QR Code name"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="description" className="text-white">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="bg-gray-700 border-gray-600 text-white"
                  placeholder="QR Code description"
                  rows={3}
                />
              </div>

              <div>
                <Label className="text-white">QR Code Image *</Label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      try {
                        const imageUrl = await qrCodeService.uploadQRCodeImage(file);
                        setFormData({ ...formData, image_url: imageUrl });
                      } catch (error) {
                        console.error('Failed to upload image:', error);
                        toast({
                          title: "Error",
                          description: "Failed to upload image. Please try again.",
                          variant: "destructive",
                        });
                      }
                    }
                  }}
                  className="mt-2 text-white"
                />
                {formData.image_url && (
                  <div className="mt-2">
                    <img 
                      src={formData.image_url} 
                      alt="QR Code preview" 
                      className="w-32 h-32 object-contain bg-white p-2 rounded"
                    />
                  </div>
                )}
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                <Label htmlFor="is_active" className="text-white">Set as Active QR Code</Label>
              </div>

              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                  className="border-gray-600 text-gray-300"
                >
                  Cancel
                </Button>
                <Button type="submit" className="bg-purple-600 hover:bg-purple-700">
                  {editingQRCode ? 'Update' : 'Create'} QR Code
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* QR Codes Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {qrCodes.map((qrCode) => (
          <Card key={qrCode.id} className="bg-gray-800 border-gray-600">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <CardTitle className="text-white text-lg">{qrCode.name}</CardTitle>
                <Badge 
                  className={qrCode.is_active 
                    ? 'bg-green-500/20 text-green-400 border-green-500/30' 
                    : 'bg-gray-500/20 text-gray-400 border-gray-500/30'
                  }
                >
                  {qrCode.is_active ? 'Active' : 'Inactive'}
                </Badge>
              </div>
              {qrCode.description && (
                <p className="text-gray-400 text-sm">{qrCode.description}</p>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              {/* QR Code Image */}
              <div className="text-center">
                <div className="bg-white p-4 rounded-lg inline-block">
                  <img 
                    src={qrCode.image_url} 
                    alt={qrCode.name}
                    className="w-32 h-32 object-contain"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleEdit(qrCode)}
                  className="border-gray-600 text-gray-300 hover:bg-gray-700"
                >
                  <Edit className="w-4 h-4 mr-1" />
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => downloadQRCode(qrCode.image_url, qrCode.name)}
                  className="border-blue-600 text-blue-400 hover:bg-blue-600/20"
                >
                  <Download className="w-4 h-4 mr-1" />
                  Download
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDelete(qrCode.id)}
                  className="border-red-600 text-red-400 hover:bg-red-600/20"
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Delete
                </Button>
              </div>

              {/* Active Toggle */}
              <div className="flex items-center justify-between pt-2 border-t border-gray-600">
                <span className="text-gray-300 text-sm">Active Status</span>
                <Switch
                  checked={qrCode.is_active}
                  onCheckedChange={(checked) => handleToggleActive(qrCode.id, checked)}
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {qrCodes.length === 0 && (
        <Card className="bg-gray-800 border-gray-600">
          <CardContent className="text-center py-12">
            <QrCode className="w-16 h-16 text-gray-500 mx-auto mb-4" />
            <p className="text-gray-400 mb-4">No QR codes found</p>
            <Button onClick={openCreateDialog} className="bg-purple-600 hover:bg-purple-700">
              <Plus className="w-4 h-4 mr-2" />
              Add Your First QR Code
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};