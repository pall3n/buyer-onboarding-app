import { AgencyShell } from '@/components/agency/AgencyShell'

export default function AgencyLayout({ children }: { children: React.ReactNode }) {
  return <AgencyShell>{children}</AgencyShell>
}
