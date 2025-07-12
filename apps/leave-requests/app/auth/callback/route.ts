import { NextResponse } from 'next/server'
// The client you created from the Server-Side Auth instructions
import { createServerClient } from '@workspace/supabase'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  // if "next" is in param, use it as the redirect URL
  let next = searchParams.get('next') ?? '/dashboard'
  if (!next.startsWith('/')) {
    // if "next" is not a relative URL, use the default
    next = '/dashboard'
  }

  if (code) {
    const supabase = await createServerClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      const forwardedHost = request.headers.get('x-forwarded-host') // original origin before load balancer
      const isLocalEnv = process.env.NODE_ENV === 'development'
      if (isLocalEnv) {
        // we can be sure that there is no load balancer in between, so no need to watch for X-Forwarded-Host
        return NextResponse.redirect(`${origin}${next}`)
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${next}`)
      } else {
        return NextResponse.redirect(`${origin}${next}`)
      }
    }
  }

  // Forward error and error_description as query params if present
  const error = searchParams.get('error')
  const errorDescription = searchParams.get('error_description')
  let errorUrl = `${origin}/auth/auth-error`
  const params = []
  if (error) params.push(`error=${encodeURIComponent(error)}`)
  if (errorDescription) params.push(`error_description=${encodeURIComponent(errorDescription)}`)
  if (params.length > 0) errorUrl += `?${params.join('&')}`

  return NextResponse.redirect(errorUrl)
}