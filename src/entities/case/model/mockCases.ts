import type { CaseData } from './types'

export const DEFAULT_CASE_DATA: CaseData = Object.freeze({
  metric: '+140',
  metricLabel: 'заявок',
  before: 'Заявки шли нерегулярно',
  done: 'Новая воронка и запуск таргета',
  after: 'Стабильный поток заявок',
  quote: '«Перестали думать, где взять клиентов — они пошли сами»',
  author: 'Мария',
  company: 'онлайн-школа',
  isVerifiedByChat: true,
  title: 'Стабильный поток заявок вместо случайных',
  category: 'SMM-СТРАТЕГИЯ',
  niche: 'Ниша: онлайн-образование',
  channel: 'Канал: таргет + воронка',
  duration: 'Срок: [срок проекта]',
})

export const CONFECTIONERY_CASE_DATA: CaseData = Object.freeze({
  metric: 'Съели за 5 минут',
  metricLabel: 'отзыв клиента',
  before: 'Торт к семейному празднику, срок — сутки',
  done: 'Вдруг не успеют и не совпадёт со вкусом',
  after: 'Заказ готов вовремя, гости в восторге',
  quote: '«Это было невероятно вкусно! Съели за 5 минут, гости просят ваш контакт»',
  author: 'Анна К.',
  company: 'кондитерская',
  isVerifiedByChat: true,
  title: 'Съели за 5 минут',
  category: 'ОТЗЫВ КЛИЕНТА',
  chatMessages: Object.freeze([
    'Это было невероятно вкусно!',
    'Съели за 5 минут, гости просят ваш контакт',
  ]),
})

export const HERO_CASE_DATA: CaseData = Object.freeze({
  metric: '+140',
  metricLabel: 'заявок',
  before: 'Заявки шли нерегулярно',
  done: 'Новая воронка и запуск таргета',
  after: 'Стабильный поток заявок',
  quote: '«Через месяц после запуска записи пошли по три-четыре в день»',
  author: 'Клиника ДокТур',
  company: 'сеть клиник',
  isVerifiedByChat: true,
  title: 'Новый сайт для сети клиник: запись онлайн вместо звонков',
  category: 'КЕЙС · ГОТОВ К ПУБЛИКАЦИИ',
  niche: 'Ниша: медицина',
  channel: 'Канал: сайт + запись за 2 клика',
  duration: 'Срок: 3 недели',
})
