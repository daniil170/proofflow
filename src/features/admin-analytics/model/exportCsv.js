const escapeCsvValue = (val) => {
  if (val === null || val === undefined) return '""'
  const stringVal = String(val).replace(/"/g, '""')
  return `"${stringVal}"`
}

export const exportApplicationsToCsv = (applications = []) => {
  const headers = [
    'ID',
    'Дата',
    'Канал',
    'Источник',
    'Электронная почта',
    'Telegram',
    'Сфера деятельности',
    'Объем кейсов в месяц',
    'Как делают кейсы сейчас',
    'Статус',
    'Инвайт-код',
    'Дата приглашения',
    'Дата активации',
    'Заметка владельца',
  ]

  const rows = applications.map((app) => [
    app.id,
    app.createdAt ? new Date(app.createdAt).toISOString() : '',
    app.channel || app.source || 'web',
    app.source || 'web',
    app.email || '',
    app.telegramUsername ? `@${app.telegramUsername}` : app.telegramUserId || '',
    app.businessType || '',
    app.casesVolume || '',
    app.currentProcess || '',
    app.status || '',
    app.inviteCode || '',
    app.invitedAt ? new Date(app.invitedAt).toISOString() : '',
    app.activatedAt ? new Date(app.activatedAt).toISOString() : '',
    app.ownerNote || '',
  ])

  const csvContent = [
    headers.map(escapeCsvValue).join(';'),
    ...rows.map((row) => row.map(escapeCsvValue).join(';')),
  ].join('\r\n')

  const bom = '\uFEFF'
  const blob = new Blob([bom + csvContent], {
    type: 'text/csv;charset=utf-8;',
  })

  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.setAttribute('href', url)
  const today = new Date().toISOString().slice(0, 10)
  link.setAttribute('download', `applications-${today}.csv`)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
