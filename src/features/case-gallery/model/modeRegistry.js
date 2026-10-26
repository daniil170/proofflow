import { CardPreview } from '../ui/card/CardPreview'
import { SitePreview } from '../ui/site/SitePreview'
import { StoryPreview } from '../ui/story/StoryPreview'

export const GALLERY_MODES = Object.freeze([
  Object.freeze({
    id: 'card',
    label: 'Карточка',
    component: CardPreview,
  }),
  Object.freeze({
    id: 'site',
    label: 'На сайте',
    component: SitePreview,
  }),
  Object.freeze({
    id: 'story',
    label: 'Сторис',
    component: StoryPreview,
  }),
])
