import { describe, expect, it } from 'vitest'
import { getEmbedCode, CMS_INSTRUCTIONS } from '../embedSnippets'

describe('embedSnippets', () => {
  it('generates embed snippet with async and defer script', () => {
    const snippet = getEmbedCode('case-abc-123', 'https://proofflow.ru')
    expect(snippet).toContain('data-proofflow-case="case-abc-123"')
    expect(snippet).toContain('async defer')
    expect(snippet).toContain('src="https://proofflow.ru/embed.js"')
  })

  it('contains CMS instructions for Tilda, WordPress, and Webflow', () => {
    const ids = CMS_INSTRUCTIONS.map((i) => i.id)
    expect(ids).toContain('tilda')
    expect(ids).toContain('wordpress')
    expect(ids).toContain('webflow')
  })
})
