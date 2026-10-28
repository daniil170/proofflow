export type IdeaStep =
  | 'idle'
  | 'awaiting_category'
  | 'awaiting_description'
  | 'awaiting_context'

export interface IdeaSessionData {
  step: IdeaStep
  category?: string
  text?: string
  voiceFileId?: string
  context?: string
}
