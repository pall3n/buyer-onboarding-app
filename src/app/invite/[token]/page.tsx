import { BuyerInvitation } from '@/components/buyer/BuyerInvitation'

export const instant = false

export default async function InvitePage(
  props: { params: Promise<{ token: string }> }
) {
  const { token } = await props.params
  void token // all demo tokens render the same invitation

  return <BuyerInvitation />
}
