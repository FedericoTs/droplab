import crypto from 'crypto';

/**
 * Campaign Landing Page Encryption System
 *
 * Encrypts recipient IDs for secure, personalized landing page access via QR codes.
 *
 * Features:
 * - AES-256-GCM encryption for recipient IDs
 * - Campaign-specific encryption (different campaigns can't decrypt each other's IDs)
 * - Time-limited tokens (90 days expiry)
 * - Tamper-proof with authenticated encryption (GCM mode)
 *
 * Security Benefits:
 * - No PII exposed in URLs
 * - Cannot enumerate recipients
 * - Cannot decrypt without campaign context
 * - Graceful fallback to generic landing page if decryption fails
 */

// Get encryption key from environment or use default for development
const ENCRYPTION_KEY = process.env.LANDING_PAGE_ENCRYPTION_KEY || 'dev-key-change-in-production-32b';

// Ensure key is 32 bytes for AES-256
const KEY_BUFFER = Buffer.from(ENCRYPTION_KEY.padEnd(32, '0').slice(0, 32));

// Token validity period (90 days in milliseconds)
const TOKEN_VALIDITY_MS = 90 * 24 * 60 * 60 * 1000;

/**
 * Generate campaign-specific salt for encryption
 * This ensures that the same recipient ID encrypts differently for different campaigns
 */
function getCampaignSalt(campaignId: string): string {
  return crypto.createHash('sha256').update(campaignId).digest('hex').slice(0, 16);
}

/**
 * Encrypt recipient ID for use in QR code URL
 *
 * @param recipientId - The recipient's unique ID
 * @param campaignId - The campaign ID (used for campaign-specific encryption)
 * @returns Base64-encoded encrypted string safe for URLs
 *
 * @example
 * const encrypted = encryptRecipientId('recipient_123', 'campaign_abc');
 * // Returns: "enc_xyz789..." (safe for URL query parameter)
 */
export function encryptRecipientId(recipientId: string, campaignId: string): string {
  try {
    // Create payload with recipient ID and expiry timestamp
    const payload = {
      recipientId,
      expiresAt: Date.now() + TOKEN_VALIDITY_MS,
    };

    const payloadStr = JSON.stringify(payload);

    // Generate campaign-specific IV (initialization vector)
    const campaignSalt = getCampaignSalt(campaignId);
    const iv = crypto.randomBytes(12); // 12 bytes for GCM mode

    // Create cipher with campaign-specific key derivation
    const cipher = crypto.createCipheriv('aes-256-gcm', KEY_BUFFER, iv);

    // Add campaign salt as additional authenticated data (AAD)
    // This ensures the encrypted data can only be decrypted with the correct campaign context
    cipher.setAAD(Buffer.from(campaignSalt));

    // Encrypt the payload
    let encrypted = cipher.update(payloadStr, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    // Get authentication tag
    const authTag = cipher.getAuthTag();

    // Combine IV + auth tag + encrypted data
    const combined = Buffer.concat([
      iv,
      authTag,
      Buffer.from(encrypted, 'hex')
    ]);

    // Return as URL-safe base64
    return 'enc_' + combined.toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt recipient ID');
  }
}

/**
 * Decrypt recipient ID from QR code URL parameter
 *
 * @param encrypted - The encrypted string from URL (with or without 'enc_' prefix)
 * @param campaignId - The campaign ID (must match the ID used for encryption)
 * @returns Recipient ID if decryption successful and token valid, null otherwise
 *
 * @example
 * const recipientId = decryptRecipientId('enc_xyz789...', 'campaign_abc');
 * if (recipientId) {
 *   // Use recipient ID to personalize landing page
 * } else {
 *   // Show generic landing page
 * }
 */
export function decryptRecipientId(encrypted: string, campaignId: string): string | null {
  try {
    // Remove 'enc_' prefix if present
    const encryptedData = encrypted.startsWith('enc_') ? encrypted.slice(4) : encrypted;

    // Convert from URL-safe base64 to buffer
    const combined = Buffer.from(
      encryptedData
        .replace(/-/g, '+')
        .replace(/_/g, '/'),
      'base64'
    );

    // Extract IV, auth tag, and encrypted data
    const iv = combined.slice(0, 12);
    const authTag = combined.slice(12, 28);
    const encryptedPayload = combined.slice(28);

    // Get campaign-specific salt
    const campaignSalt = getCampaignSalt(campaignId);

    // Create decipher
    const decipher = crypto.createDecipheriv('aes-256-gcm', KEY_BUFFER, iv);

    // Set AAD (must match encryption)
    decipher.setAAD(Buffer.from(campaignSalt));

    // Set auth tag
    decipher.setAuthTag(authTag);

    // Decrypt
    let decrypted = decipher.update(encryptedPayload.toString('hex'), 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    // Parse payload
    const payload = JSON.parse(decrypted);

    // Check if token is still valid
    if (Date.now() > payload.expiresAt) {
      console.log('Token expired for recipient:', payload.recipientId);
      return null;
    }

    return payload.recipientId;
  } catch (error) {
    // Decryption failed - could be tampered, wrong campaign, or corrupted
    // This is expected behavior - gracefully return null for generic fallback
    console.log('Decryption failed (expected for invalid/tampered tokens):', error instanceof Error ? error.message : 'Unknown error');
    return null;
  }
}

/**
 * Check if encrypted token is valid without decrypting
 *
 * @param encrypted - The encrypted string from URL
 * @returns true if token format is valid (doesn't guarantee decryption will succeed)
 *
 * @example
 * if (!isTokenValid(urlParam)) {
 *   // Immediately show generic landing page
 * }
 */
export function isTokenValid(encrypted: string): boolean {
  try {
    // Remove 'enc_' prefix if present
    const encryptedData = encrypted.startsWith('enc_') ? encrypted.slice(4) : encrypted;

    // Check if it's valid base64
    const combined = Buffer.from(
      encryptedData
        .replace(/-/g, '+')
        .replace(/_/g, '/'),
      'base64'
    );

    // Check minimum length (12 IV + 16 auth tag + at least some encrypted data)
    if (combined.length < 40) {
      return false;
    }

    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Generate a test encrypted ID for development/testing
 *
 * @param recipientId - Test recipient ID
 * @param campaignId - Test campaign ID
 * @returns Encrypted token for testing
 *
 * @example
 * // In development/testing
 * const testToken = generateTestToken('recipient_123', 'campaign_abc');
 * console.log('Test QR URL:', `/lp/campaign/campaign_abc?r=${testToken}`);
 */
export function generateTestToken(recipientId: string, campaignId: string): string {
  return encryptRecipientId(recipientId, campaignId);
}
