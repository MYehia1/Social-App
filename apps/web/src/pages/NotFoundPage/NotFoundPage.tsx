import { Link } from 'react-router-dom'
import { Compass } from 'lucide-react'
import { EmptyState } from '@/components/ui'
import { useI18n } from '@/i18n'

export function NotFoundPage() {
  const { t } = useI18n()
  return (
    <EmptyState
      icon={Compass}
      title={t('error.notFound.title')}
      description={t('error.notFound.description')}
      action={


        <Link
          to="/"
          className="inline-flex h-10 items-center justify-center rounded-lg bg-brand px-4 text-sm font-medium text-on-brand transition-colors hover:bg-brand-hover"
        >
          Back to feed
        </Link>
      }
    />
  )
}
