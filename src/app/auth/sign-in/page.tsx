import { signIn } from './actions'

interface SignInPageProps {
  searchParams: Promise<{ error?: string }>
}

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const { error } = await searchParams

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--bi-background)] px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="font-serif text-2xl text-[var(--bi-ink)]">
            Hartfield &amp; Rowe
          </h1>
          <p className="mt-1 text-sm text-[var(--bi-muted)]">Sign in to your account</p>
        </div>

        {error === 'invalid_credentials' && (
          <div
            role="alert"
            className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            Invalid email or password. Please try again.
          </div>
        )}

        <form action={signIn} className="space-y-4">
          <div className="space-y-1">
            <label
              htmlFor="email"
              className="block text-sm font-medium text-[var(--bi-ink)]"
            >
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="w-full rounded-xl border border-[var(--bi-line)] bg-[var(--bi-surface)] px-4 py-2.5 text-sm text-[var(--bi-ink)] placeholder:text-[var(--bi-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--bi-sage)]"
              placeholder="you@example.com"
            />
          </div>

          <div className="space-y-1">
            <label
              htmlFor="password"
              className="block text-sm font-medium text-[var(--bi-ink)]"
            >
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className="w-full rounded-xl border border-[var(--bi-line)] bg-[var(--bi-surface)] px-4 py-2.5 text-sm text-[var(--bi-ink)] placeholder:text-[var(--bi-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--bi-sage)]"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-xl bg-[var(--bi-ink)] px-4 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bi-sage)]"
          >
            Sign in
          </button>
        </form>
      </div>
    </div>
  )
}
