import { act, renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { MAX_FILE_SIZE_BYTES, MAX_FILES_PER_CASE } from '@/shared/config/limits.ts'
import { detectFileKind, useCaseUpload } from '../useCaseUpload.js'

describe('detectFileKind', () => {
  it('detects screenshot for image types', () => {
    expect(detectFileKind({ type: 'image/png' })).toBe('screenshot')
    expect(detectFileKind({ type: 'image/jpeg' })).toBe('screenshot')
  })

  it('detects audio for audio types', () => {
    expect(detectFileKind({ type: 'audio/mpeg' })).toBe('audio')
    expect(detectFileKind({ type: 'audio/wav' })).toBe('audio')
  })

  it('detects video for video types', () => {
    expect(detectFileKind({ type: 'video/mp4' })).toBe('video')
    expect(detectFileKind({ type: 'video/webm' })).toBe('video')
  })
})

describe('useCaseUpload hook', () => {
  const mockUploader = {
    upload: vi.fn((file, path, onProgress) => {
      if (onProgress) onProgress(100)
      return {
        promise: Promise.resolve({ storagePath: path, downloadUrl: 'https://test/file' }),
        cancel: vi.fn(),
      }
    }),
  }

  const mockRepository = {
    create: vi.fn((data) =>
      Promise.resolve({
        id: 'created-case-1',
        ...data,
      })
    ),
    seedExamples: vi.fn((ownerId) =>
      Promise.resolve([
        {
          id: 'example-case-1',
          ownerId,
          title: 'Демо кейс',
          status: 'review',
        },
      ])
    ),
  }

  it('initializes with default values', () => {
    const { result } = renderHook(() =>
      useCaseUpload({
        user: { id: 'user-1' },
        uploader: mockUploader,
        repository: mockRepository,
      })
    )

    expect(result.current.files).toEqual([])
    expect(result.current.clientLabel).toBe('')
    expect(result.current.language).toBe('ru')
    expect(result.current.consentConfirmed).toBe(false)
    expect(result.current.canSubmit).toBe(false)
    expect(result.current.isSubmitting).toBe(false)
    expect(result.current.isRecording).toBe(false)
  })

  it('adds valid files with correct kind and order', () => {
    const { result } = renderHook(() =>
      useCaseUpload({
        user: { id: 'user-1' },
        uploader: mockUploader,
        repository: mockRepository,
      })
    )

    const file1 = new File(['content'], 'screenshot.png', { type: 'image/png' })
    const file2 = new File(['audio'], 'call.mp3', { type: 'audio/mpeg' })

    act(() => {
      result.current.addFiles([file1, file2])
    })

    expect(result.current.files).toHaveLength(2)
    expect(result.current.files[0].kind).toBe('screenshot')
    expect(result.current.files[0].order).toBe(0)
    expect(result.current.files[1].kind).toBe('audio')
    expect(result.current.files[1].order).toBe(1)
  })

  it('rejects unsupported mime types', () => {
    const { result } = renderHook(() =>
      useCaseUpload({
        user: { id: 'user-1' },
        uploader: mockUploader,
        repository: mockRepository,
      })
    )

    const invalidFile = new File(['code'], 'script.exe', {
      type: 'application/x-msdownload',
    })

    act(() => {
      result.current.addFiles([invalidFile])
    })

    expect(result.current.files).toHaveLength(0)
    expect(result.current.errorMessage).toContain('неподдерживаемый формат')
  })

  it('rejects files exceeding MAX_FILE_SIZE_BYTES', () => {
    const { result } = renderHook(() =>
      useCaseUpload({
        user: { id: 'user-1' },
        uploader: mockUploader,
        repository: mockRepository,
      })
    )

    const largeFile = new File([''], 'huge.mp4', { type: 'video/mp4' })
    Object.defineProperty(largeFile, 'size', { value: MAX_FILE_SIZE_BYTES + 1000 })

    act(() => {
      result.current.addFiles([largeFile])
    })

    expect(result.current.files).toHaveLength(0)
    expect(result.current.errorMessage).toContain('превышает лимит')
  })

  it('respects MAX_FILES_PER_CASE limit', () => {
    const { result } = renderHook(() =>
      useCaseUpload({
        user: { id: 'user-1' },
        uploader: mockUploader,
        repository: mockRepository,
      })
    )

    const manyFiles = Array.from(
      { length: MAX_FILES_PER_CASE + 2 },
      (_, i) => new File(['img'], `img-${i}.png`, { type: 'image/png' })
    )

    act(() => {
      result.current.addFiles(manyFiles)
    })

    expect(result.current.files.length).toBeLessThanOrEqual(MAX_FILES_PER_CASE)
  })

  it('removes file by id and re-indexes order', () => {
    const { result } = renderHook(() =>
      useCaseUpload({
        user: { id: 'user-1' },
        uploader: mockUploader,
        repository: mockRepository,
      })
    )

    const f1 = new File(['1'], '1.png', { type: 'image/png' })
    const f2 = new File(['2'], '2.png', { type: 'image/png' })

    act(() => {
      result.current.addFiles([f1, f2])
    })

    const firstId = result.current.files[0].id

    act(() => {
      result.current.removeFile(firstId)
    })

    expect(result.current.files).toHaveLength(1)
    expect(result.current.files[0].order).toBe(0)
  })

  it('reorders files up and down', () => {
    const { result } = renderHook(() =>
      useCaseUpload({
        user: { id: 'user-1' },
        uploader: mockUploader,
        repository: mockRepository,
      })
    )

    const f1 = new File(['1'], 'first.png', { type: 'image/png' })
    const f2 = new File(['2'], 'second.png', { type: 'image/png' })

    act(() => {
      result.current.addFiles([f1, f2])
    })

    const secondId = result.current.files[1].id

    act(() => {
      result.current.moveFileUp(secondId)
    })

    expect(result.current.files[0].name).toBe('second.png')
    expect(result.current.files[1].name).toBe('first.png')

    act(() => {
      result.current.moveFileDown(secondId)
    })

    expect(result.current.files[0].name).toBe('first.png')
    expect(result.current.files[1].name).toBe('second.png')
  })

  it('handles clipboard paste of screenshots', () => {
    const { result } = renderHook(() =>
      useCaseUpload({
        user: { id: 'user-1' },
        uploader: mockUploader,
        repository: mockRepository,
      })
    )

    const pastedBlob = new Blob(['img'], { type: 'image/png' })
    const fakeEvent = {
      preventDefault: vi.fn(),
      clipboardData: {
        items: [
          {
            type: 'image/png',
            getAsFile: () => pastedBlob,
          },
        ],
      },
    }

    act(() => {
      result.current.handlePaste(fakeEvent)
    })

    expect(fakeEvent.preventDefault).toHaveBeenCalled()
    expect(result.current.files).toHaveLength(1)
    expect(result.current.files[0].kind).toBe('screenshot')
  })

  it('enables canSubmit only when consent is confirmed and files exist', () => {
    const { result } = renderHook(() =>
      useCaseUpload({
        user: { id: 'user-1' },
        uploader: mockUploader,
        repository: mockRepository,
      })
    )

    expect(result.current.canSubmit).toBe(false)

    act(() => {
      result.current.setConsentConfirmed(true)
    })
    expect(result.current.canSubmit).toBe(false)

    act(() => {
      result.current.addFiles([new File(['1'], '1.png', { type: 'image/png' })])
    })
    expect(result.current.canSubmit).toBe(true)

    act(() => {
      result.current.setConsentConfirmed(false)
    })
    expect(result.current.canSubmit).toBe(false)
  })

  it('creates example case on tryExampleCase and triggers onSuccess', async () => {
    const onSuccess = vi.fn()
    const { result } = renderHook(() =>
      useCaseUpload({
        user: { id: 'user-42' },
        uploader: mockUploader,
        repository: mockRepository,
        onSuccess,
      })
    )

    await act(async () => {
      await result.current.tryExampleCase()
    })

    expect(mockRepository.seedExamples).toHaveBeenCalledWith('user-42')
    expect(onSuccess).toHaveBeenCalledWith(expect.objectContaining({ id: 'example-case-1' }))
  })

  it('uploads files and creates processing case document on submitAndUpload', async () => {
    const onSuccess = vi.fn()
    const { result } = renderHook(() =>
      useCaseUpload({
        user: { id: 'user-42' },
        uploader: mockUploader,
        repository: mockRepository,
        onSuccess,
      })
    )

    act(() => {
      result.current.addFiles([new File(['test'], 'interview.mp3', { type: 'audio/mpeg' })])
      result.current.setClientLabel('FinFlow')
      result.current.setConsentConfirmed(true)
    })

    await act(async () => {
      await result.current.submitAndUpload()
    })

    expect(mockUploader.upload).toHaveBeenCalled()
    expect(mockRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        ownerId: 'user-42',
        status: 'processing',
        clientLabel: 'FinFlow',
        consentConfirmed: true,
        sources: expect.arrayContaining([
          expect.objectContaining({
            kind: 'audio',
            mimeType: 'audio/mpeg',
          }),
        ]),
      })
    )
    expect(onSuccess).toHaveBeenCalled()
  })
})
