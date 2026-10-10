import { useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ApiError } from '@/lib/api'
import { useAuth } from '@/lib/auth'

export function SignupPage() {
  const { token, signup } = useAuth()
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)

  if (token) return <Navigate to="/profile" replace />

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    const password = String(form.get('password'))
    const passwordConfirmation = String(form.get('passwordConfirmation'))
    setError(null)
    setFieldErrors({})

    if (password !== passwordConfirmation) {
      setFieldErrors({ passwordConfirmation: 'Las contraseñas no coinciden.' })
      return
    }

    setSubmitting(true)
    try {
      await signup({
        fullName: String(form.get('fullName')).trim() || null,
        email: String(form.get('email')),
        password,
        passwordConfirmation,
      })
      navigate('/profile', { replace: true })
    } catch (err) {
      if (err instanceof ApiError && err.status === 422) {
        const fields = err.fieldErrors
        if (fields.email && err.errors.some((x) => x.field === 'email' && x.rule === 'database.unique')) {
          fields.email = 'Este email ya está registrado.'
        }
        setFieldErrors(fields)
        if (Object.keys(fields).length === 0) setError(err.message)
      } else {
        setError(err instanceof ApiError ? err.message : 'Ha ocurrido un error inesperado.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="flex min-h-svh items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Crear cuenta</CardTitle>
          <CardDescription>Regístrate para empezar a usar FlowSync.</CardDescription>
        </CardHeader>
        <form onSubmit={onSubmit} className="flex flex-col gap-6">
          <CardContent className="grid gap-4">
            {error && (
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
            )}
            <div className="grid gap-2">
              <Label htmlFor="fullName">Nombre (opcional)</Label>
              <Input id="fullName" name="fullName" autoComplete="name" aria-invalid={!!fieldErrors.fullName} />
              {fieldErrors.fullName && <p className="text-sm text-destructive">{fieldErrors.fullName}</p>}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" autoComplete="email" required aria-invalid={!!fieldErrors.email} />
              {fieldErrors.email && <p role="alert" className="text-sm text-destructive">{fieldErrors.email}</p>}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                minLength={8}
                maxLength={32}
                required
                aria-invalid={!!fieldErrors.password}
              />
              {fieldErrors.password && <p className="text-sm text-destructive">{fieldErrors.password}</p>}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="passwordConfirmation">Confirmar contraseña</Label>
              <Input
                id="passwordConfirmation"
                name="passwordConfirmation"
                type="password"
                autoComplete="new-password"
                required
                aria-invalid={!!fieldErrors.passwordConfirmation}
              />
              {fieldErrors.passwordConfirmation && (
                <p className="text-sm text-destructive">{fieldErrors.passwordConfirmation}</p>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex-col gap-3">
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? 'Creando cuenta…' : 'Registrarse'}
            </Button>
            <p className="text-sm text-muted-foreground">
              ¿Ya tienes cuenta?{' '}
              <Link to="/login" className="text-primary underline underline-offset-4">
                Inicia sesión
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </main>
  )
}
