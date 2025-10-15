export interface RecipientData {
  name: string;
  lastname: string;
  address: string;
  city?: string;
  zip?: string;
  email?: string;
  phone?: string;
  customMessage?: string;
  storeNumber?: string; // For retail module: links recipient to specific store
}

export interface DirectMailData {
  trackingId: string;
  recipient: RecipientData;
  message: string;
  qrCodeDataUrl: string;
  landingPageUrl: string;
  createdAt: Date;
  creativeImageUrl?: string; // AI-generated DM creative image
}

export interface LandingPageData {
  trackingId: string;
  recipient: RecipientData;
  message: string;
  companyName: string;
  createdAt: Date;
  visits: number;
}

export interface DMGenerateRequest {
  recipient: RecipientData;
  message: string;
}

export interface DMGenerateResponse {
  success: boolean;
  data?: DirectMailData;
  error?: string;
  campaignId?: string;
  campaignName?: string;
}
