import { useState } from 'react'
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
import { ConfirmDialog, DropdownMenu, MenuItem } from '@/components/ui'
import { useDeletePost } from '../../hooks'
import { EditPostDialog } from '../EditPostDialog'
import type { Post } from '@/types/api'
import { useI18n } from '@/i18n'

export function PostActions({ post }: { post: Post }) {
  const { t } = useI18n()
  const [editing, setEditing] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const deletePost = useDeletePost()

  return (


    <div className="relative z-10">
      <DropdownMenu
        trigger={(props) => (
          <button
            type="button"
            aria-label={t('post.actions.label')}
            className="grid size-8 cursor-pointer place-items-center rounded-lg text-subtle transition-colors hover:bg-surface-hover hover:text-content"
            {...props}
          >
            <MoreHorizontal className="size-4" aria-hidden="true" />
          </button>
        )}
      >
        {(close) => (
          <>
            <MenuItem
              onClick={() => {
                close()
                setEditing(true)
              }}
            >
              <Pencil className="size-4" aria-hidden="true" />
              Edit post
            </MenuItem>
            <MenuItem
              destructive
              onClick={() => {
                close()
                setConfirming(true)
              }}
            >
              <Trash2 className="size-4" aria-hidden="true" />
              Delete post
            </MenuItem>
          </>
        )}
      </DropdownMenu>

      {editing && (
        <EditPostDialog post={post} open onClose={() => setEditing(false)} />
      )}

      {confirming && (
        <ConfirmDialog
          open
          onClose={() => setConfirming(false)}
          onConfirm={() =>
            deletePost.mutate(post.id, { onSuccess: () => setConfirming(false) })
          }
          loading={deletePost.isPending}
          title={t('post.delete.title')}
          description={t('post.delete.description')}
        />
      )}
    </div>
  )
}
