interface RegisterRequest {
  email: string;
  password: string;
}

interface UserResponse {
  id: number;
  email: string;
  role: string;
}

interface ApiResponse<T> {
  data: T;
  message?: string;
}

interface ApiError {
  statusCode: number;
  message: string | string[];
  error: string;
}

export async function registerApi(data: RegisterRequest): Promise<ApiResponse<UserResponse>> {
  const response = await fetch('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    let message = 'Request failed';
    try {
      const error: ApiError = await response.json();
      message = Array.isArray(error.message) ? error.message.join(', ') : error.message;
    } catch {
      message = response.statusText || 'Request failed';
    }
    throw new Error(message);
  }

  return response.json();
}

export async function meApi(): Promise<ApiResponse<UserResponse>> {
  const response = await fetch('/api/auth/me');
  if (!response.ok) {
    let message = 'Request failed';
    try {
      const error: ApiError = await response.json();
      message = Array.isArray(error.message) ? error.message.join(', ') : error.message;
    } catch {
      message = response.statusText || 'Request failed';
    }
    throw new Error(message);
  }
  return response.json();
}

export async function logoutApi(): Promise<void> {
  const response = await fetch('/api/auth/logout', { method: 'POST' });
  if (!response.ok) {
    let message = 'Request failed';
    try {
      const error: ApiError = await response.json();
      message = Array.isArray(error.message) ? error.message.join(', ') : error.message;
    } catch {
      message = response.statusText || 'Request failed';
    }
    throw new Error(message);
  }
}
