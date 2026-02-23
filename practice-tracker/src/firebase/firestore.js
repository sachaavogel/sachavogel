import { db } from './config'
import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  addDoc,
  query,
  where,
  getDocs,
  orderBy,
  serverTimestamp
} from 'firebase/firestore'

// Users collection
export const usersCollection = collection(db, 'users')

export const getUserDoc = (uid) => doc(db, 'users', uid)

export const createUserDoc = async (uid, userData) => {
  try {
    await setDoc(doc(db, 'users', uid), {
      ...userData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    })
    return { error: null }
  } catch (error) {
    return { error }
  }
}

export const updateUserDoc = async (uid, updates) => {
  try {
    await updateDoc(doc(db, 'users', uid), {
      ...updates,
      updatedAt: serverTimestamp()
    })
    return { error: null }
  } catch (error) {
    return { error }
  }
}

// Practice sessions (using subcollection for better organization)
export const getPracticeSessionsCollection = (userId) =>
  collection(db, 'users', userId, 'practiceSessions')

export const addPracticeSession = async (userId, sessionData) => {
  try {
    const docRef = await addDoc(collection(db, 'users', userId, 'practiceSessions'), {
      ...sessionData,
      createdAt: serverTimestamp()
    })
    return { id: docRef.id, error: null }
  } catch (error) {
    return { id: null, error }
  }
}

export const getPracticeSessions = async (userId, limit = 50) => {
  try {
    const q = query(
      collection(db, 'users', userId, 'practiceSessions'),
      orderBy('date', 'desc'),
      limit
    )
    const querySnapshot = await getDocs(q)
    const sessions = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
    return { sessions, error: null }
  } catch (error) {
    return { sessions: [], error }
  }
}

export const deletePracticeSession = async (userId, sessionId) => {
  try {
    await deleteDoc(doc(db, 'users', userId, 'practiceSessions', sessionId))
    return { error: null }
  } catch (error) {
    return { error }
  }
}

export const getSessionsForDateRange = async (userId, startDate, endDate) => {
  try {
    const q = query(
      collection(db, 'users', userId, 'practiceSessions'),
      where('date', '>=', startDate),
      where('date', '<=', endDate),
      orderBy('date', 'desc')
    )
    const querySnapshot = await getDocs(q)
    const sessions = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
    return { sessions, error: null }
  } catch (error) {
    return { sessions: [], error }
  }
}
