import { useEffect, useState } from 'react'

const getAdminEmails = () => {
  const envVal =
    import.meta.env.VITE_ADMIN_EMAILS ||
    'dutpayev74@gmail.com,daniilivakin30@gmail.com,admin@proofflow.ru,owner@proofflow.ru'
  return envVal
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
}

export const useAdminClaimSync = (user, gateway) => {
  const [claimAdmin, setClaimAdmin] = useState(false)
  const isEmailAdmin = user?.email
    ? getAdminEmails().includes(user.email.toLowerCase())
    : false
  const isAdmin = isEmailAdmin || claimAdmin

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
