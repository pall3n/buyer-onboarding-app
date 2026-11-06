import { z } from 'zod'

export const CreateInvitationFormSchema = z.object({
  displayName: z
    .string()
    .min(1, 'Display name is required')
    .max(120, 'Display name must be 120 characters or fewer')
    .trim(),
  note: z
    .string()
    .max(500, 'Note must be 500 characters or fewer')
    .optional(),
  prefillBudgetMin: z
    .union([z.number().nonnegative(), z.nan()])
    .optional()
    .transform((v) => (typeof v === 'number' && !isNaN(v) ? v : undefined)),
  prefillBudgetMax: z
    .union([z.number().nonnegative(), z.nan()])
    .optional()
    .transform((v) => (typeof v === 'number' && !isNaN(v) ? v : undefined)),
  prefillLocation: z
    .string()
    .max(200, 'Location must be 200 characters or fewer')
    .trim()
    .optional(),
})

export type CreateInvitationFormData = z.infer<typeof CreateInvitationFormSchema>

export const InvitationRowSchema = z.object({
  id: z.string().uuid(),
  agency_id: z.string().uuid(),
  inviter_id: z.string().uuid(),
  buyer_subject_id: z.string().uuid().nullable(),
  token_hash: z.string(),
  expires_at: z.string(),
  status: z.enum(['pending', 'accepted', 'expired', 'revoked']),
  display_name: z.string(),
  note: z.string().nullable(),
  prefill: z.record(z.string(), z.unknown()),
  created_at: z.string(),
  updated_at: z.string(),
})

export type InvitationRow = z.infer<typeof InvitationRowSchema>

/** Safe invitation: omits the token_hash. */
export const SafeInvitationSchema = z.object({
  id: z.string().uuid(),
  agency_id: z.string().uuid(),
  inviter_id: z.string().uuid(),
  buyer_subject_id: z.string().uuid().nullable(),
  expires_at: z.string(),
  status: z.enum(['pending', 'accepted', 'expired', 'revoked']),
  display_name: z.string(),
  note: z.string().nullable(),
  prefill: z.record(z.string(), z.unknown()),
  created_at: z.string(),
  updated_at: z.string(),
})

export type SafeInvitation = z.infer<typeof SafeInvitationSchema>
