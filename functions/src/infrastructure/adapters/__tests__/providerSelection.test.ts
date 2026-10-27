import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  createCaseAnalyzer,
  createChatReader,
  createTranscriber,
  resolveAnalyzerProvider,
  resolveChatReaderProvider,
  resolveTranscriberProvider,
} from '../providerFactory.js'
import { MockCaseAnalyzer } from '../MockCaseAnalyzer.js'
import { MockChatReader } from '../MockChatReader.js'
import { MockTranscriber } from '../MockTranscriber.js'
import { WhisperTranscriber } from '../WhisperTranscriber.js'
import { ClaudeChatReader } from '../ClaudeChatReader.js'
import { ClaudeCaseAnalyzer } from '../ClaudeCaseAnalyzer.js'
import { GeminiTranscriber } from '../GeminiTranscriber.js'
import { GeminiChatReader } from '../GeminiChatReader.js'
import { GeminiCaseAnalyzer } from '../GeminiCaseAnalyzer.js'
import { GoogleSpeechTranscriber } from '../GoogleSpeechTranscriber.js'

describe('provider resolution & factory', () => {
  const originalEnv = { ...process.env }

  beforeEach(() => {
    process.env = { ...originalEnv }
    process.env.ANTHROPIC_MODEL = 'claude-3-5-sonnet-latest'
  })

  afterEach(() => {
    process.env = { ...originalEnv }
  })
  it('resolves default providers when env vars are unset', () => {
    expect(resolveTranscriberProvider(undefined, false)).toBe('openai')
    expect(resolveTranscriberProvider(undefined, true)).toBe('mock')

    expect(resolveChatReaderProvider(undefined, false)).toBe('anthropic')
    expect(resolveChatReaderProvider(undefined, true)).toBe('mock')

    expect(resolveAnalyzerProvider(undefined, false)).toBe('anthropic')
    expect(resolveAnalyzerProvider(undefined, true)).toBe('mock')
  })

  it('resolves explicit provider names correctly regardless of case', () => {
    expect(resolveTranscriberProvider('google')).toBe('google')
    expect(resolveTranscriberProvider('GOOGLE-SPEECH')).toBe('google-speech')
    expect(resolveTranscriberProvider('openai')).toBe('openai')
    expect(resolveTranscriberProvider('mock')).toBe('mock')

    expect(resolveChatReaderProvider('google')).toBe('google')
    expect(resolveChatReaderProvider('anthropic')).toBe('anthropic')
    expect(resolveChatReaderProvider('mock')).toBe('mock')

    expect(resolveAnalyzerProvider('google')).toBe('google')
    expect(resolveAnalyzerProvider('anthropic')).toBe('anthropic')
    expect(resolveAnalyzerProvider('mock')).toBe('mock')
  })

  it('throws on unknown provider values with descriptive message', () => {
    expect(() => resolveTranscriberProvider('deepseek')).toThrow(
      /Неизвестный провайдер транскрибации TRANSCRIBER_PROVIDER: "deepseek"/
    )
    expect(() => resolveChatReaderProvider('mistral')).toThrow(
      /Неизвестный провайдер чтения скриншотов CHAT_READER_PROVIDER: "mistral"/
    )
    expect(() => resolveAnalyzerProvider('llama')).toThrow(
      /Неизвестный провайдер анализатора кейсов ANALYZER_PROVIDER: "llama"/
    )
  })

  it('instantiates appropriate adapter classes based on resolved provider', () => {
    const geminiConfig = {
      mode: 'api' as const,
      model: 'gemini-1.5-flash',
      apiKey: 'test-key',
    }

    const mockTranscriber = createTranscriber('mock', { isProd: false })
    expect(mockTranscriber).toBeInstanceOf(MockTranscriber)

    const whisperTranscriber = createTranscriber('openai', {
      isProd: false,
      openaiKey: 'test-openai-key',
    })
    expect(whisperTranscriber).toBeInstanceOf(WhisperTranscriber)

    const geminiTranscriber = createTranscriber('google', {
      isProd: false,
      geminiConfig,
    })
    expect(geminiTranscriber).toBeInstanceOf(GeminiTranscriber)

    const googleSpeechTranscriber = createTranscriber('google-speech', {
      isProd: false,
      googleSpeechConfig: { apiKey: 'test-speech-key' },
    })
    expect(googleSpeechTranscriber).toBeInstanceOf(GoogleSpeechTranscriber)

    const mockChat = createChatReader('mock', { isProd: false })
    expect(mockChat).toBeInstanceOf(MockChatReader)

    const claudeChat = createChatReader('anthropic', {
      isProd: false,
      anthropicKey: 'test-anthropic-key',
    })
    expect(claudeChat).toBeInstanceOf(ClaudeChatReader)

    const geminiChat = createChatReader('google', {
      isProd: false,
      geminiConfig,
    })
    expect(geminiChat).toBeInstanceOf(GeminiChatReader)

    const mockAnalyzer = createCaseAnalyzer('mock', { isProd: false })
    expect(mockAnalyzer).toBeInstanceOf(MockCaseAnalyzer)

    const claudeAnalyzer = createCaseAnalyzer('anthropic', {
      isProd: false,
      anthropicKey: 'test-anthropic-key',
    })
    expect(claudeAnalyzer).toBeInstanceOf(ClaudeCaseAnalyzer)

    const geminiAnalyzer = createCaseAnalyzer('google', {
      isProd: false,
      geminiConfig,
    })
    expect(geminiAnalyzer).toBeInstanceOf(GeminiCaseAnalyzer)
  })
})
