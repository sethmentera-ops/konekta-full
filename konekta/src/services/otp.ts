export type OtpPurpose = 'signup' | 'reset';

export interface OtpResult {
  ok: boolean;
  error?: string;
  channel?: 'email' | 'phone';
  resendIn?: number;
  proof?: string;
}

async function post(url: string, body: object): Promise<OtpResult> {
  try {
    const r = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      // the free Render server can take up to a minute to wake up
      signal: AbortSignal.timeout(60000),
    });
    return await r.json();
  } catch {
    return { ok: false, error: 'Walang sagot ang server. Subukan ulit mamaya.' };
  }
}

export const OtpService = {
  send: (identifier: string, purpose: OtpPurpose = 'signup') =>
    post('/api/otp/send', { identifier, purpose }),
  verify: (identifier: string, code: string, purpose: OtpPurpose = 'signup') =>
    post('/api/otp/verify', { identifier, code, purpose }),
};
