import { apiFetch, apiFetchBlob, apiFetchNoContent } from '@/lib/api/client'
import { parseArtifactResult, parseArtifactsListResult } from './fileGuards'
import type { ArtifactDetail } from './types'

const ARTIFACTS_BASE = '/api/v1/artifacts'
const CONV_BASE = '/api/v1/conversations'

function limitQuery(limit?: number): string {
  if (limit === undefined) return ''
  return `?limit=${encodeURIComponent(String(limit))}`
}

export async function listArtifacts(opts?: { limit?: number }): Promise<{ artifacts: ArtifactDetail[] }> {
  return apiFetch(
    `${ARTIFACTS_BASE}${limitQuery(opts?.limit ?? 100)}`,
    { auth: true, method: 'GET' },
    parseArtifactsListResult,
  )
}

export function getArtifactById(artifactId: string): Promise<{ artifact: ArtifactDetail }> {
  return apiFetch(
    `${ARTIFACTS_BASE}/${encodeURIComponent(artifactId)}`,
    { auth: true, method: 'GET' },
    parseArtifactResult,
  )
}

export function deleteArtifact(artifactId: string): Promise<void> {
  return apiFetchNoContent(`${ARTIFACTS_BASE}/${encodeURIComponent(artifactId)}`, {
    auth: true,
    method: 'DELETE',
  })
}

export function downloadArtifact(artifactId: string): Promise<Blob> {
  return apiFetchBlob(`${ARTIFACTS_BASE}/${encodeURIComponent(artifactId)}/download`)
}

export async function listConversationArtifacts(
  conversationId: string,
  opts?: { limit?: number },
): Promise<{ artifacts: ArtifactDetail[] }> {
  return apiFetch(
    `${CONV_BASE}/${encodeURIComponent(conversationId)}/artifacts${limitQuery(opts?.limit ?? 100)}`,
    { auth: true, method: 'GET' },
    parseArtifactsListResult,
  )
}
