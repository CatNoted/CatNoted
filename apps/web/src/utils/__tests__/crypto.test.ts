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
    const payloads = [new Uint8Array(0), new Uint8Array(20), new Uint8Array(27)];
    for (const payload of payloads) {
      await expect(decryptPayload(payload, passphrase)).rejects.toThrow(
        'Invalid encrypted payload'
      );
    }
  });

  it('should fail decryption when incorrect passphrase is provided', async () => {
    const encrypted = await encryptPayload(sampleData, passphrase);
    const wrongPassphrase = 'WrongPassword456!';

    await expect(decryptPayload(encrypted, wrongPassphrase)).rejects.toThrow();
  });

  it('encryptPayload should produce a properly formatted payload', async () => {
    const encrypted = await encryptPayload(sampleData, passphrase);
    // Total length = 16 (salt) + 12 (iv) + ciphertext length
    // The AES-GCM ciphertext will include a 16 byte authentication tag, so it should be sampleData.length + 16
    expect(encrypted.length).toBe(16 + 12 + sampleData.length + 16);

    // We can extract salt and IV to ensure they are the correct size
    const salt = encrypted.slice(0, 16);
    const iv = encrypted.slice(16, 28);
    expect(salt.length).toBe(16);
    expect(iv.length).toBe(12);
  });

  it('encryptPayload should generate unique salt and IV for consecutive encryptions', async () => {
    const enc1 = await encryptPayload(sampleData, passphrase);
    const enc2 = await encryptPayload(sampleData, passphrase);

    const salt1 = enc1.slice(0, 16);
    const iv1 = enc1.slice(16, 28);

    const salt2 = enc2.slice(0, 16);
    const iv2 = enc2.slice(16, 28);

    // Using vitest's strictEqual/toEqual on TypedArrays
    expect(salt1).not.toEqual(salt2);
    expect(iv1).not.toEqual(iv2);
  });
});
