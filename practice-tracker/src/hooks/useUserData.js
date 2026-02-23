import { useUserData as useUserDataContext } from '../context/UserDataContext'
import { useAuth } from './useAuth'

export const useUserData = () => {
  const auth = useAuth()
  const context = useUserDataContext()

  return {
    ...context,
    ...auth
  }
}
