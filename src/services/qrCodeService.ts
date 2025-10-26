// For now, we'll use a simpler approach with localStorage until the Supabase table is set up
// This is a temporary implementation that can be easily upgraded when the database table is created

export interface QRCode {
  id: string;
  name: string;
  description?: string;
  image_url: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const QR_CODES_KEY = 'admin_qr_codes';

export const qrCodeService = {
  async getActiveQRCode(): Promise<QRCode | null> {
    const qrCodes = this.getAllQRCodesFromStorage();
    return qrCodes.find(qr => qr.is_active) || null;
  },

  async getAllQRCodes(): Promise<QRCode[]> {
    return this.getAllQRCodesFromStorage();
  },

  getAllQRCodesFromStorage(): QRCode[] {
    try {
      const stored = localStorage.getItem(QR_CODES_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error parsing QR codes from storage:', error);
      return [];
    }
  },

  saveQRCodesToStorage(qrCodes: QRCode[]): void {
    try {
      localStorage.setItem(QR_CODES_KEY, JSON.stringify(qrCodes));
    } catch (error) {
      console.error('Error saving QR codes to storage:', error);
    }
  },

  async createQRCode(qrCodeData: Omit<QRCode, 'id' | 'created_at' | 'updated_at'>): Promise<QRCode> {
    const qrCodes = this.getAllQRCodesFromStorage();
    
    // If this QR code is being set as active, deactivate all others
    if (qrCodeData.is_active) {
      qrCodes.forEach(qr => qr.is_active = false);
    }

    const newQRCode: QRCode = {
      ...qrCodeData,
      id: `qr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    qrCodes.unshift(newQRCode);
    this.saveQRCodesToStorage(qrCodes);
    
    return newQRCode;
  },

  async updateQRCode(id: string, updates: Partial<Omit<QRCode, 'id' | 'created_at' | 'updated_at'>>): Promise<QRCode> {
    const qrCodes = this.getAllQRCodesFromStorage();
    const qrCodeIndex = qrCodes.findIndex(qr => qr.id === id);
    
    if (qrCodeIndex === -1) {
      throw new Error('QR Code not found');
    }

    // If this QR code is being set as active, deactivate all others
    if (updates.is_active) {
      qrCodes.forEach(qr => qr.is_active = false);
    }

    const updatedQRCode = {
      ...qrCodes[qrCodeIndex],
      ...updates,
      updated_at: new Date().toISOString()
    };

    qrCodes[qrCodeIndex] = updatedQRCode;
    this.saveQRCodesToStorage(qrCodes);
    
    return updatedQRCode;
  },

  async deleteQRCode(id: string): Promise<void> {
    const qrCodes = this.getAllQRCodesFromStorage();
    const filteredQRCodes = qrCodes.filter(qr => qr.id !== id);
    this.saveQRCodesToStorage(filteredQRCodes);
  },

  async setActiveQRCode(id: string): Promise<void> {
    const qrCodes = this.getAllQRCodesFromStorage();
    
    // Deactivate all QR codes
    qrCodes.forEach(qr => qr.is_active = false);
    
    // Activate the selected one
    const targetQRCode = qrCodes.find(qr => qr.id === id);
    if (targetQRCode) {
      targetQRCode.is_active = true;
      targetQRCode.updated_at = new Date().toISOString();
    }
    
    this.saveQRCodesToStorage(qrCodes);
  },

  // For now, we'll use a simple approach for image handling
  // This can be upgraded to use Supabase storage when available
  async uploadQRCodeImage(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          resolve(e.target.result as string);
        } else {
          reject(new Error('Failed to read file'));
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  }
};