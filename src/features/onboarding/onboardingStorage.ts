const ONBOARDING_STORAGE_KEY = 'grizon-onboarding-complete'
const COMPLETE_VALUE = 'true'

/**
 * Storage access is wrapped because Safari private mode throws on both reads
 * and writes. A failure here must never block the workspace, so it degrades to
 * "not yet onboarded" — the flow reappears, which is the safe direction.
 */
function warn(action: string, error: unknown): void {
  console.warn(`Onboarding: could not ${action} completion flag in localStorage — ${String(error)}`)
}

export function hasCompletedOnboarding(): boolean {
  try {
    return localStorage.getItem(ONBOARDING_STORAGE_KEY) === COMPLETE_VALUE
  } catch (error) {
    warn('read the', error)
    return false
  }
}

export function markOnboardingComplete(): void {
  try {
    localStorage.setItem(ONBOARDING_STORAGE_KEY, COMPLETE_VALUE)
  } catch (error) {
    warn('write the', error)
  }
}

export function clearOnboardingComplete(): void {
  try {
    localStorage.removeItem(ONBOARDING_STORAGE_KEY)
  } catch (error) {
    warn('clear the', error)
  }
}
