import { useState, useEffect, useCallback } from 'react'
import { useUserData } from './useUserData'
import {
  addPracticeSession as addSession,
  getPracticeSessions,
  deletePracticeSession as deleteSession,
  getSessionsForDateRange
} from '../firebase/firestore'

export const usePracticeSessions = () => {
  const { user } = useUserData()
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(false)

  const fetchSessions = useCallback(async (limit = 500) => {
    if (!user) return

    try {
      setLoading(true)
      const result = await getPracticeSessions(user.uid, limit)
      setSessions(result.sessions)
      return result
    } catch (error) {
      console.error('Error fetching sessions:', error)
      return { sessions: [], error }
    } finally {
      setLoading(false)
    }
  }, [user])

  const addPracticeSession = useCallback(async (sessionData) => {
    if (!user) return { id: null, error: 'No user logged in' }

    try {
      const result = await addSession(user.uid, sessionData)
      if (result.error) return result
      const fetchResult = await fetchSessions()
      return { id: result.id, error: fetchResult.error, sessions: fetchResult.sessions }
    } catch (error) {
      return { id: null, error: error.message }
    }
  }, [user, fetchSessions])

  const removePracticeSession = useCallback(async (sessionId) => {
    if (!user) return { error: 'No user logged in' }

    try {
      const result = await deleteSession(user.uid, sessionId)
      if (result.error) return result
      const fetchResult = await fetchSessions()
      return { error: fetchResult.error, sessions: fetchResult.sessions }
    } catch (error) {
      return { error: error.message }
    }
  }, [user, fetchSessions])

  const fetchSessionsForRange = useCallback(async (startDate, endDate) => {
    if (!user) return { sessions: [], error: 'No user logged in' }

    try {
      const result = await getSessionsForDateRange(user.uid, startDate, endDate)
      return result
    } catch (error) {
      return { sessions: [], error }
    }
  }, [user])

  useEffect(() => {
    if (user) {
      fetchSessions()
    } else {
      setSessions([])
    }
  }, [user, fetchSessions])

  return {
    sessions,
    loading,
    fetchSessions,
    addPracticeSession,
    deletePracticeSession: removePracticeSession,
    fetchSessionsForRange
  }
}
