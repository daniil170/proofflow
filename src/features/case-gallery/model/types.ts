import type { CaseCardVariant, CaseData } from '@/entities/case'

export type GalleryModeId = 'card' | 'site' | 'story'
export type DeviceType = 'desktop' | 'mobile'

export interface GalleryItem {
  readonly id: CaseCardVariant
  readonly variant: CaseCardVariant
  readonly title: string
  readonly description: string
  readonly data: CaseData
  readonly storyBackground: string
}

export interface GalleryModeOption {
  readonly id: GalleryModeId
  readonly label: string
}
