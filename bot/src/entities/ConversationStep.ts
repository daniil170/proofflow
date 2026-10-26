export type ConversationStep =
  | 'idle'
  | 'awaiting_business_type'
  | 'awaiting_cases_volume'
  | 'awaiting_feedback'
  | 'awaiting_consent'
  | 'awaiting_delete_confirmation'
  | 'completed'
