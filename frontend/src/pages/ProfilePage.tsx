import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { api, ApiError, type User } from '@/lib/api'
import { useAuth } from '@/lib/auth'

export function ProfilePage() {
  const { token, logout, clearSession } = useAuth()
  const navigate = useNavigate()
  const [user, setUser] = useState<User | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!token) return
    let cancelled = false
    api
      .profile(token)
      .then((u) => !cancelled && setUser(u))
      .catch((err) => {
        if (cancelled) return
        if (err instanceof ApiError && err.status === 401) {
          clearSession()
          navigate('/login', { replace: true })
        } else {
          setError(err instanceof ApiError ? err.message : 'No se pudo cargar el perfil.')
        }
      })
    return () => {
      cancelled = true
    }
  }, [token, clearSession, navigate])

  async function onLogout() {
    await logout()
    navigate('/login', { replace: true })
  }

  return (
    <main className="flex min-h-svh items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Mi perfil</CardTitle>
          <CardDescription>Datos de tu cuenta.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
          {!user && !error && <p className="text-sm text-muted-foreground">Cargando…</p>}
          {user && (
            <dl className="grid gap-2 text-sm">
              <div>
                <dt className="text-muted-foreground">Nombre</dt>
                <dd>{user.fullName ?? '—'}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Email</dt>
                <dd>{user.email}</dd>
              </div>
            </dl>
          )}
          <Button variant="outline" onClick={onLogout}>
            Cerrar sesión
          </Button>
        </CardContent>
      </Card>
    </main>
  )
}
