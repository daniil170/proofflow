export type {
  Case,
  CaseBranding,
  CaseCardVariantType,
  CaseDraft,
  CaseDraftHeadline,
  CaseDraftMetric,
  CaseDraftQuote,
  CaseStatus,
  ChatExtraction,
  ChatMessage,
  ChatMessageSide,
  Evidence,
  EvidenceKind,
  MessengerType,
  PersistedChatMessage,
  PublicCase,
  Source,
  SourceKind,
  SummaryRow,
  SummaryRowOrigin,
  Transcript,
  TranscriptSegment,
} from './schemas.ts'

export interface CaseData {
  readonly headline?: string
  readonly metric?: string
  readonly metricLabel?: string
  readonly before?: string
  readonly done?: string
  readonly after?: string
  readonly summaryRows?: readonly {
    id?: string
    label: string
    text: string
    evidenceId?: string | null
    origin?: string
  }[]
  readonly quote?: string
  readonly author?: string
  readonly authorRole?: string
  readonly authorCompany?: string
  readonly company?: string
  readonly isVerifiedByChat?: boolean
  readonly messenger?: 'telegram' | 'whatsapp' | 'unknown'
  readonly chatMessages?: readonly (string | { side: string; text: string; time?: string })[]
  readonly cardMessages?: readonly { side: string; text: string; time?: string }[]
  readonly title?: string
  readonly category?: string
  readonly date?: string
  readonly niche?: string
  readonly channel?: string
  readonly duration?: string
  readonly accentColor?: string
}

export type CaseCardVariant = 'dark' | 'newspaper' | 'whatsapp' | 'receipt' | 'minimal'
