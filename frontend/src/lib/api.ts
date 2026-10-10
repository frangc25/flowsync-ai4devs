const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3333'
const BASE = `${API_URL}/api/v1`

export interface User {
  id: number
  fullName: string | null
  email: string
  createdAt: string
  updatedAt: string
  initials: string
}

interface ApiErrorItem {
  message: string
  rule?: string
  field?: string
}

export class ApiError extends Error {
  status: number
  errors: ApiErrorItem[]

  constructor(status: number, errors: ApiErrorItem[]) {
    super(errors[0]?.message ?? `Error ${status}`)
    this.status = status
    this.errors = errors
  }

  /** Mensajes de validación indexados por campo (respuestas 422). */
  get fieldErrors(): Record<string, string> {
    const out: Record<string, string> = {}
    for (const e of this.errors) {
      if (e.field && !out[e.field]) out[e.field] = e.message
    }
    return out
  }
}

async function request<T>(path: string, init: RequestInit = {}, token?: string | null): Promise<T> {
  let res: Response
  try {
    res = await fetch(`${BASE}${path}`, {
      ...init,
      headers: {
        Accept: 'application/json',
        ...(init.body ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    })
  } catch {
    throw new ApiError(0, [{ message: 'No se pudo conectar con el servidor. Inténtalo de nuevo.' }])
  }

  const body = await res.json().catch(() => null)
  if (!res.ok) {
    throw new ApiError(res.status, body?.errors ?? [{ message: `Error ${res.status}` }])
  }
  return body as T
}

export interface AuthResult {
  user: User
  token: string
}

export interface SignupInput {
  fullName: string | null
  email: string
  password: string
  passwordConfirmation: string
}

export const api = {
  signup: (input: SignupInput) =>
    request<{ data: AuthResult }>('/auth/signup', { method: 'POST', body: JSON.stringify(input) }).then((r) => r.data),
  login: (input: { email: string; password: string }) =>
    request<{ data: AuthResult }>('/auth/login', { method: 'POST', body: JSON.stringify(input) }).then((r) => r.data),
  profile: (token: string) => request<{ data: User }>('/account/profile', {}, token).then((r) => r.data),
  logout: (token: string) => request<{ message: string }>('/account/logout', { method: 'POST' }, token),
}
