import { useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { authApi } from '@/lib/api/auth'
import { usersApi } from '@/lib/api/users'
import { queryKeys } from '@/lib/queryKeys'
import { useAuth } from '@/providers/auth-context'
import type { ChangePasswordPayload, ProfilePayload } from '@/types/api'
import { toLocalisedMessage, useI18n } from '@/i18n'

export function useUploadPhoto() {
  const { t } = useI18n()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (photo: File) => usersApi.uploadPhoto(photo),
    onSuccess: async (user) => {
      toast.success(t('toast.photoUpdated'))
      queryClient.setQueryData(queryKeys.currentUser(), user)

      await queryClient.invalidateQueries({ queryKey: queryKeys.posts() })
    },
    onError: (error) => toast.error(toLocalisedMessage(t, error)),
  })
}

export function useUploadCover() {
  const { t } = useI18n()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (cover: File) => usersApi.uploadCover(cover),
    onSuccess: (user) => {
      toast.success(t('toast.coverUpdated'))
      queryClient.setQueryData(queryKeys.currentUser(), user)
    },
    onError: (error) => toast.error(toLocalisedMessage(t, error)),
  })
}

export function useUpdateProfile() {
  const { t } = useI18n()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: ProfilePayload) => usersApi.updateProfile(payload),
    onSuccess: async (user) => {
      toast.success(t('toast.profileUpdated'))
      queryClient.setQueryData(queryKeys.currentUser(), user)

      await queryClient.invalidateQueries({ queryKey: queryKeys.posts() })
    },
    onError: (error) => toast.error(toLocalisedMessage(t, error)),
  })
}

export function useChangePassword() {
  const { t } = useI18n()
  const { signIn } = useAuth()

  return useMutation({
    mutationFn: (payload: ChangePasswordPayload) => authApi.changePassword(payload),
    onSuccess: ({ accessToken, user }) => {


      signIn(accessToken, user)
      toast.success(t('toast.passwordChanged'))
    },
    onError: (error) => toast.error(toLocalisedMessage(t, error)),
  })
}
