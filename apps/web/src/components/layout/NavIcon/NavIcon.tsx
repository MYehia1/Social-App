import { Bell, Home, User as UserIcon, Users } from 'lucide-react'
import { cn } from '@/lib/cn'

export type NavIconName = 'home' | 'people' | 'notifications' | 'profile'


const LUCIDE = {
  home: {


    evenOdd: true,
    paths: [
      'M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8',
    ],
    circles: [],
  },
  people: {
    evenOdd: false,
    paths: [
      'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2',
      'M16 3.128a4 4 0 0 1 0 7.744',
      'M22 21v-2a4 4 0 0 0-3-3.87',
    ],
    circles: [{ cx: 9, cy: 7, r: 4 }],
  },
  notifications: {
    evenOdd: false,
    paths: [
      'M10.268 21a2 2 0 0 0 3.464 0',
      'M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326',
    ],
    circles: [],
  },
  profile: {
    evenOdd: false,
    paths: ['M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2'],
    circles: [{ cx: 12, cy: 7, r: 4 }],
  },
} as const satisfies Record<
  NavIconName,
  {
    evenOdd: boolean
    paths: readonly string[]
    circles: readonly { cx: number; cy: number; r: number }[]
  }
>

const OUTLINE = {
  home: Home,
  people: Users,
  notifications: Bell,
  profile: UserIcon,
} as const


export function NavIcon({
  name,
  active,
  className,
}: {
  name: NavIconName
  active: boolean
  className?: string
}) {
  if (!active) {
    const Outline = OUTLINE[name]
    return <Outline className={className} aria-hidden="true" />
  }

  const icon = LUCIDE[name]

  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"


      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={cn('shrink-0', className)}
    >
      {icon.paths.map((d) => (
        <path key={d} d={d} fillRule={icon.evenOdd ? 'evenodd' : undefined} />
      ))}
      {icon.circles.map((circle) => (
        <circle key={`${circle.cx}-${circle.cy}`} {...circle} />
      ))}
    </svg>
  )
}
