import { DEFAULT_CASE_DATA, CONFECTIONERY_CASE_DATA } from '@/entities/case'
import type { GalleryItem } from './types'

export const GALLERY_ITEMS: readonly GalleryItem[] = Object.freeze([
  Object.freeze({
    id: 'dark',
    variant: 'dark',
    title: 'Тёмная',
    description: 'Строгий B2B-стиль с акцентной лаймовой метрикой и щитом верификации',
    data: DEFAULT_CASE_DATA,
    storyBackground: 'linear-gradient(135deg, #d6f94c 0%, #a3e635 100%)',
  }),
  Object.freeze({
    id: 'newspaper',
    variant: 'newspaper',
    title: 'Газета',
    description: 'Винтажная колонка «Вестник кейсов» с антиквой и красной метрикой',
    data: DEFAULT_CASE_DATA,
    storyBackground: 'linear-gradient(135deg, #23201c 0%, #141210 100%)',
  }),
  Object.freeze({
    id: 'whatsapp',
    variant: 'whatsapp',
    title: 'WhatsApp',
    description: 'Живой диалог из мессенджера с баблами и цитатой клиента',
    data: CONFECTIONERY_CASE_DATA,
    storyBackground: 'linear-gradient(135deg, #075e54 0%, #128c7e 100%)',
  }),
  Object.freeze({
    id: 'receipt',
    variant: 'receipt',
    title: 'Чек',
    description: 'Термочек с точечными строками, итогом в рамке и штрихкодом',
    data: CONFECTIONERY_CASE_DATA,
    storyBackground: 'linear-gradient(135deg, #1f2937 0%, #111827 100%)',
  }),
  Object.freeze({
    id: 'minimal',
    variant: 'minimal',
    title: 'Минимализм',
    description: 'Чистая белая карточка с гигантской цифрой и чёткими разделителями',
    data: DEFAULT_CASE_DATA,
    storyBackground: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
  }),
])
