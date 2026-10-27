export const exportUserData = async ({ user, userRecord, caseRepository }) => {
  if (!user?.id) {
    throw new Error('Пользователь не авторизован для экспорта данных')
  }

  let userCases = []
  if (caseRepository && typeof caseRepository.listByOwner === 'function') {
    try {
      userCases = await caseRepository.listByOwner(user.id)
    } catch {
      userCases = []
    }
  }

  const exportPayload = {
    exportVersion: '1.0',
    exportedAt: new Date().toISOString(),
    user: {
      id: user.id,
      email: user.email || null,
      displayName: user.displayName || userRecord?.profile?.displayName || null,
      accessStatus: userRecord?.accessStatus || 'active',
      profile: userRecord?.profile || null,
      consent: userRecord?.consent || null,
      telegramUserId: userRecord?.telegramUserId || null,
      workspaceId: userRecord?.workspaceId || user.id,
      createdAt: userRecord?.createdAt || null,
      updatedAt: userRecord?.updatedAt || null,
    },
    casesCount: userCases.length,
    cases: userCases.map((c) => ({
      id: c.id,
      title: c.title || null,
      client: c.client || c.clientLabel || null,
      status: c.status || 'draft',
      createdAt: c.createdAt || null,
      updatedAt: c.updatedAt || null,
      publishedAt: c.publishedAt || null,
      draft: c.draft || null,
      metric: c.metric || null,
      metricLabel: c.metricLabel || null,
      summary: c.summary || null,
      quote: c.quote || null,
      author: c.author || null,
      branding: c.branding || null,
      selectedVariant: c.selectedVariant || 'dark',
      sources: (c.sources || []).map((s) => ({
        id: s.id,
        kind: s.kind,
        mimeType: s.mimeType,
        order: s.order,
      })),
    })),
  }

  if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    const jsonString = JSON.stringify(exportPayload, null, 2)
    const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `proofflow-export-${user.id}-${Date.now()}.json`
    document.body.appendChild(anchor)
    anchor.click()
    document.body.removeChild(anchor)
    URL.revokeObjectURL(url)
  }

  return exportPayload
}
