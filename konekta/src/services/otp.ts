export interface OtpResult {
  ok: boolean;
  error?: string;
  channel?: 'email' | 'phone';
  resendIn?: number;
}

async function post(url: string, body: object): Promise<OtpResult> {
  try {
    const r = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    return await r.json();
  } catch {
    return { ok: false, error: 'Walang koneksyon sa server. Subukan ulit.' };
  }
}

export const OtpService = {
  send: (identifier: string) => post('/api/otp/send', { identifier }),
  verify: (identifier: string, code: string) => post('/api/otp/verify', { identifier, code }),
};
