import type { ReactionType } from '@/types/api'

export const REACTION_META: Record<ReactionType, { emoji: string; label: string }> = {
  like: { emoji: '\u{1F44D}', label: 'Like' },
  love: { emoji: '\u2764\uFE0F', label: 'Love' },
  haha: { emoji: '\u{1F602}', label: 'Haha' },
  wow: { emoji: '\u{1F62E}', label: 'Wow' },
  sad: { emoji: '\u{1F622}', label: 'Sad' },
  angry: { emoji: '\u{1F621}', label: 'Angry' },
}
