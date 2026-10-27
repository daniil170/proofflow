import { useEffect, useState } from 'react'

export const useUserSubscription = (userId, userRepository) => {
  const [record, setRecord] = useState(null)
  const [syncedId, setSyncedId] = useState(null)

  const isLoadingRecord = Boolean(userId && syncedId !== userId)
  const userRecord = userId ? record : null

  useEffect(() => {
    if (!userId || !userRepository) {
      return undefined
    }

    let isMounted = true

    const unsubscribe = userRepository.subscribeToUser(
      userId,
      (nextRecord) => {
        if (!isMounted) return
        setRecord(nextRecord)
        setSyncedId(userId)
      },
      () => {
        if (!isMounted) return
        setSyncedId(userId)
      }
    )

    return () => {
      isMounted = false
      if (typeof unsubscribe === 'function') {
        unsubscribe()
      }
    }
  }, [userId, userRepository])

  return { userRecord, setUserRecord: setRecord, isLoadingRecord }
}
