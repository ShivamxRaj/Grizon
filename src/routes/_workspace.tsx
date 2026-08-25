import { useEffect, type JSX } from 'react'
import { Outlet, createFileRoute, redirect, useNavigate, useRouterState } from '@tanstack/react-router'
import '@/features/landing/landing.css'
import '@/features/chat/chat.css'
import { AuthModalProvider } from '@/features/auth/AuthModalProvider'
import { useAuth } from '@/features/auth/useAuth'
import { ChatSidebar } from '@/features/chat/components/ChatSidebar'
import { CanvasPanel } from '@/features/chat/components/canvas/CanvasPanel'
import { CanvasProvider } from '@/features/chat/context/CanvasProvider'
import { SidebarDrawerProvider } from '@/features/chat/context/SidebarDrawerProvider'
import { useCanvas } from '@/features/chat/hooks/useCanvas'
import { CreditProvider } from '@/features/billing/CreditProvider'
import { SettingsModalProvider } from '@/features/settings/SettingsModalProvider'
import { OnboardingProvider } from '@/features/onboarding/OnboardingProvider'
import { EmailVerifyGate } from '@/features/auth/components/EmailVerifyGate'

export const Route = createFileRoute('/_workspace')({
  beforeLoad: ({ context, location }) => {
    const isHome = location.pathname === '/'
    if (context.auth.status === 'unauthenticated' && !isHome) {
      throw redirect({ to: '/' })
    }
  },
  component: WorkspaceLayout,
})

/** `beforeLoad` only runs on navigation — also react when logout clears the session in place. */
function useHomeOnLogout(): void {
  const { status } = useAuth()
  const navigate = useNavigate()
  const pathname = useRouterState({ select: (state) => state.location.pathname })

  useEffect(() => {
    if (status === 'unauthenticated' && pathname !== '/') {
      void navigate({ to: '/' })
    }
  }, [status, pathname, navigate])
}

function WorkspaceLayout(): JSX.Element {
  useHomeOnLogout()

  return (
    <AuthModalProvider requireAuth>
      <SidebarDrawerProvider>
        <CanvasProvider>
          <OnboardingProvider>
            <CreditProvider>
              <SettingsModalProvider>
                <div className="chat-shell relative z-[1] flex h-dvh overflow-hidden">
                  <ChatSidebar />
                  <Outlet />
                  <WorkspaceCanvasSlot />
                </div>
                <EmailVerifyGate />
              </SettingsModalProvider>
            </CreditProvider>
          </OnboardingProvider>
        </CanvasProvider>
      </SidebarDrawerProvider>
    </AuthModalProvider>
  )
}

function WorkspaceCanvasSlot(): JSX.Element | null {
  const { isOpen } = useCanvas()
  return isOpen ? <CanvasPanel /> : null
}
