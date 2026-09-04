import { Fragment } from 'react'
import { Link } from 'react-router-dom'


const MENTION = /(@[a-z0-9_]{3,20})/gi


export function RichText({ text, className }: { text: string; className?: string }) {
  const parts = text.split(MENTION)

  return (
    <span dir="auto" className={className}>
      {parts.map((part, index) => {
        if (!part.startsWith('@')) return <Fragment key={index}>{part}</Fragment>

        const handle = part.slice(1).toLowerCase()
        return (
          <Link
            key={index}
            to={`/u/${handle}`}
            className="font-medium text-brand-text hover:underline"
            onClick={(event) => event.stopPropagation()}
          >
            <bdi>{part}</bdi>
          </Link>
        )
      })}
    </span>
  )
}
