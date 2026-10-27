export const DEFAULT_INVITE_TEMPLATE =
  'Здравствуйте{namePrefix}! Ваша заявка на ранний доступ к ProofFlow одобрена.\n\nВаш персональный инвайт-код: {code}\nСсылка для активации: {link}\n\nСрок действия: 14 дней. Перейдите по ссылке, чтобы создать свои первые кейсы!'

export const formatInviteMessage = (template, { name = '', code = '', link = '' }) => {
  const namePrefix = name.trim() ? `, ${name.trim()}` : ''
  return template
    .replace('{namePrefix}', namePrefix)
    .replace('{name}', name.trim() || 'друг')
    .replace('{code}', code)
    .replace('{link}', link)
}
