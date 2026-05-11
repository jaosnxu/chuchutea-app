// CHUCHUTEA — API Client
const BASE_URL = 'http://10.114.156.101:3000/api';

interface LoginResponse {
  user?: { id: string; name: string; role: string; orgId: string };
  error?: string;
}

class ApiClient {
  private token: string | null = null;
  private refreshToken: string | null = null;

  setTokens(access: string, refresh: string) {
    this.token = access;
    this.refreshToken = refresh;
  }

  private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    let res = await fetch(`${BASE_URL}${path}`, { ...options, headers });

    // If 401, try refresh
    if (res.status === 401 && this.refreshToken) {
      const refreshRes = await fetch(`${BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: this.refreshToken }),
      });
      if (refreshRes.ok) {
        const data = await refreshRes.json();
        this.token = data.accessToken;
        headers['Authorization'] = `Bearer ${this.token}`;
        res = await fetch(`${BASE_URL}${path}`, { ...options, headers });
      }
    }

    return res.json();
  }

  async login(phone: string, password: string): Promise<LoginResponse> {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, password }),
      credentials: 'include',
    });
    const data = await res.json();
    if (res.headers.get('set-cookie')) {
      const cookies = res.headers.get('set-cookie') || '';
      const access = cookies.match(/access_token=([^;]+)/)?.[1];
      const refresh = cookies.match(/refresh_token=([^;]+)/)?.[1];
      if (access) this.token = access;
      if (refresh) this.refreshToken = refresh;
    }
    return data;
  }

  async get<T>(path: string): Promise<T> {
    return this.request<T>(path);
  }

  async post<T>(path: string, body: any): Promise<T> {
    return this.request<T>(path, { method: 'POST', body: JSON.stringify(body) });
  }

  async patch<T>(path: string, body: any): Promise<T> {
    return this.request<T>(path, { method: 'PATCH', body: JSON.stringify(body) });
  }
}

export const api = new ApiClient();
