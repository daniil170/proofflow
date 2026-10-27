import { useEffect, useState } from 'react'

export const useAdminClaimSync = (user, gateway) => {
  const [claimAdmin, setClaimAdmin] = useState(false)
  const isAdmin = user?.email ? claimAdmin : false

  useEffect(() => {
    if (!user?.email || !gateway || typeof gateway.syncAdminClaims !== 'function') {
      return undefined
    }

    let isMounted = true

    gateway
      .syncAdminClaims(user.email)
      .then((hasAdmin) => {
        if (isMounted) {
          setClaimAdmin(Boolean(hasAdmin))
        }
      })
      .catch(() => {
        if (isMounted) {
          setClaimAdmin(false)
        }
      })

    return () => {
      isMounted = false
    }
  }, [user?.email, gateway])

  return { isAdmin, setIsAdmin: setClaimAdmin }
}
