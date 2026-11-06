import { AgencyShell } from '@/components/agency/AgencyShell'
import { requireAgentAuth } from '@/lib/auth'

export default async function AgencyLayout({ children }: { children: React.ReactNode }) {
  await requireAgentAuth()
  return <AgencyShell>{children}</AgencyShell>
}
