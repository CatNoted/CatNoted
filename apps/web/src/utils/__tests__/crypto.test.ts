import { describe, it, expect } from 'vitest';
import { encryptPayload, decryptPayload } from '../crypto.js';

describe('Whitebox Test: Web Crypto Payload Encryption & Decryption', () => {
  const passphrase = 'SuperSecretMasterKey123!';
  const sampleData = new TextEncoder().encode('CatNoted Confidential User Note Content');

  it('should encrypt and decrypt payload returning exact original byte array', async () => {
    const encrypted = await encryptPayload(sampleData, passphrase);
    expect(encrypted.length).toBeGreaterThan(28); // Salt(16) + IV(12) + Ciphertext

    const decrypted = await decryptPayload(encrypted, passphrase);
    const decodedText = new TextDecoder().decode(decrypted);

    expect(decodedText).toBe('CatNoted Confidential User Note Content');
  });

  it('should throw error when payload is too short (<28 bytes)', async () => {
    const shortPayload = new Uint8Array(20);
    await expect(decryptPayload(shortPayload, passphrase)).rejects.toThrow(
      'Invalid encrypted payload'
    );
  });

  it('should fail decryption when incorrect passphrase is provided', async () => {
    const encrypted = await encryptPayload(sampleData, passphrase);
    const wrongPassphrase = 'WrongPassword456!';

    await expect(decryptPayload(encrypted, wrongPassphrase)).rejects.toThrow();
  });
});
