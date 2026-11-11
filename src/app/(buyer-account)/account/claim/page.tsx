import { redirect } from 'next/navigation'
import { createServerComponentClient } from '@/lib/supabase/server'
import { verifyAndClaim } from '@/features/buyer-account/index'

type Props = {
  params: Promise<Record<string, never>>
  searchParams: Promise<{ demo?: string | string[]; error?: string | string[] }>
}

async function claimAction(formData: FormData) {
  'use server'
  const token = (formData.get('token') as string | null)?.trim() ?? ''
  if (!token) return

  const supabase = await createServerComponentClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/auth/sign-in?role=buyer')

  const result = await verifyAndClaim(token, user.id)

  if (result.success) {
    redirect('/account')
  } else {
    redirect(`/account/claim?error=${result.reason}`)
  }
}

const ERROR_MESSAGES: Record<string, string> = {
  token_not_found: 'That code was not recognised. Please check the code and try again.',
  token_expired: 'That code has expired. Please ask for a new one.',
  token_used: 'That code has already been used.',
  already_claimed: 'This profile has already been claimed. Contact your agent if you think this is wrong.',
}

export default async function ClaimPage(props: Props) {
  const searchParams = await props.searchParams
  const rawDemo = Array.isArray(searchParams.demo) ? searchParams.demo[0] : searchParams.demo
  const isDemo = rawDemo === '1'
  const rawError = Array.isArray(searchParams.error) ? searchParams.error[0] : searchParams.error
  const error = rawError ?? null

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold mb-2" style={{ color: 'var(--bi-ink)' }}>
          Claim your profile
        </h1>
        <p className="text-sm leading-relaxed" style={{ color: 'var(--bi-muted)' }}>
          Your agent can generate a 6-digit claim code to link this account to your existing
          profile. Enter it below to get started.
        </p>
      </div>

      {/* Why this matters */}
      <div
        className="rounded-xl px-5 py-4 text-sm"
        style={{ background: 'var(--bi-surface)', border: '1px solid var(--bi-border)' }}
      >
        <h2 className="font-medium mb-2" style={{ color: 'var(--bi-ink)' }}>
          Why we ask for a code
        </h2>
        <p style={{ color: 'var(--bi-muted)' }}>
          Matching based solely on email address is not secure — it only proves you own the inbox,
          not that you are the person who filled in the profile. The claim code confirms you
          received it from your agent, verifying both your identity and that the agent recognises
          you.
        </p>
      </div>

      {error && (
        <div
          className="rounded-xl px-4 py-3 text-sm"
          style={{ background: '#fee2e2', border: '1px solid #fca5a5', color: '#991b1b' }}
        >
          {ERROR_MESSAGES[error] ?? 'Something went wrong. Please try again.'}
        </div>
      )}

      {isDemo && (
        <div
          className="rounded-xl px-4 py-3 text-sm"
          style={{ background: '#fef3c7', border: '1px solid #fcd34d', color: '#78350f' }}
        >
          <strong>Demo mode.</strong> Use the code <code className="font-mono">123456</code> to
          simulate a successful claim. No real data is changed.
        </div>
      )}

      <form action={claimAction} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="token"
            className="text-sm font-medium"
            style={{ color: 'var(--bi-ink)' }}
          >
            6-digit claim code
          </label>
          <input
            id="token"
            name="token"
            type="text"
            inputMode="numeric"
            pattern="[0-9]{6}"
            maxLength={6}
            placeholder="000000"
            autoComplete="one-time-code"
            required
            className="w-full max-w-xs rounded-lg border px-4 py-2.5 text-lg font-mono tracking-widest outline-none focus:ring-2"
            style={{
              borderColor: 'var(--bi-border)',
              background: 'var(--bi-surface)',
              color: 'var(--bi-ink)',
            }}
          />
        </div>

        <button
          type="submit"
          disabled={isDemo}
          className="w-full max-w-xs rounded-lg px-4 py-2.5 text-sm font-medium transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            background: 'var(--bi-sage)',
            color: '#fff',
          }}
          title={isDemo ? 'Form submit is disabled in demo view' : undefined}
        >
          Claim profile
        </button>
      </form>

      {/* Contact fallback */}
      <p className="text-sm" style={{ color: 'var(--bi-muted)' }}>
        Don&apos;t have a code? Ask your agent to generate one for you. If you are not sure
        whether you have a profile, you do not need to claim it — it only becomes relevant when
        you want to manage which agencies can see your preferences.
      </p>
    </div>
  )
}
