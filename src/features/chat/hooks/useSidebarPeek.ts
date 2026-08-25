import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type RefObject,
} from 'react';

const SIDEBAR_PEEK_DELAY_MS = 600;
const SIDEBAR_PEEK_LEAVE_MS = 200;
const SETTINGS_PORTAL_SELECTOR =
  '.chat-settings-menu, .chat-settings-flyout, .chat-settings-sheet';

interface UseSidebarPeekOptions {
  /** Desktop collapsed rail only — false while pinned, mobile drawer open, or on mobile. */
  enabled: boolean;
}

interface UseSidebarPeekResult {
  peeking: boolean;
  sidebarRef: RefObject<HTMLElement | null>;
  closePeek: () => void;
  onPointerEnter: () => void;
  onPointerLeave: (event: ReactPointerEvent<HTMLElement>) => void;
}

function isOverSidebarOrPortal(
  target: EventTarget | null,
  sidebar: HTMLElement | null,
): boolean {
  if (!(target instanceof Element)) return false;
  if (sidebar?.contains(target)) return true;
  return Boolean(target.closest(SETTINGS_PORTAL_SELECTOR));
}

function usePeekTimers(setPeeking: (value: boolean) => void): {
  clearTimers: () => void;
  closePeek: () => void;
  scheduleEnter: () => void;
  scheduleLeaveClose: () => void;
} {
  const enterTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const leaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimers = useCallback((): void => {
    if (enterTimerRef.current !== null) {
      clearTimeout(enterTimerRef.current);
      enterTimerRef.current = null;
    }
    if (leaveTimerRef.current !== null) {
      clearTimeout(leaveTimerRef.current);
      leaveTimerRef.current = null;
    }
  }, []);

  const closePeek = useCallback((): void => {
    clearTimers();
    setPeeking(false);
  }, [clearTimers, setPeeking]);

  const scheduleEnter = useCallback((): void => {
    clearTimers();
    enterTimerRef.current = setTimeout(
      () => setPeeking(true),
      SIDEBAR_PEEK_DELAY_MS,
    );
  }, [clearTimers, setPeeking]);

  const scheduleLeaveClose = useCallback((): void => {
    clearTimers();
    leaveTimerRef.current = setTimeout(
      () => setPeeking(false),
      SIDEBAR_PEEK_LEAVE_MS,
    );
  }, [clearTimers, setPeeking]);

  useEffect(() => (): void => clearTimers(), [clearTimers]);

  return { clearTimers, closePeek, scheduleEnter, scheduleLeaveClose };
}

export function useSidebarPeek({
  enabled,
}: UseSidebarPeekOptions): UseSidebarPeekResult {
  const [peeking, setPeeking] = useState(false);
  const sidebarRef = useRef<HTMLElement | null>(null);
  const { clearTimers, closePeek, scheduleEnter, scheduleLeaveClose } =
    usePeekTimers(setPeeking);

  useEffect(() => {
    if (!enabled) closePeek();
  }, [enabled, closePeek]);

  useOutsidePeekClose(
    peeking && enabled,
    sidebarRef,
    clearTimers,
    scheduleLeaveClose,
  );

  const onPointerEnter = useCallback((): void => {
    if (enabled) scheduleEnter();
  }, [enabled, scheduleEnter]);

  const onPointerLeave = useCallback(
    (event: ReactPointerEvent<HTMLElement>): void => {
      if (!enabled) return;
      if (isOverSidebarOrPortal(event.relatedTarget, sidebarRef.current))
        return;
      scheduleLeaveClose();
    },
    [enabled, scheduleLeaveClose],
  );

  return { peeking, sidebarRef, closePeek, onPointerEnter, onPointerLeave };
}

/** While peeking, close when the pointer leaves both the sidebar and settings portals. */
function useOutsidePeekClose(
  active: boolean,
  sidebarRef: RefObject<HTMLElement | null>,
  clearTimers: () => void,
  scheduleLeaveClose: () => void,
): void {
  useEffect(() => {
    if (!active) return;

    function onPointerOver(event: PointerEvent): void {
      if (isOverSidebarOrPortal(event.target, sidebarRef.current)) {
        clearTimers();
        return;
      }
      scheduleLeaveClose();
    }

    document.addEventListener('pointerover', onPointerOver);
    return (): void =>
      document.removeEventListener('pointerover', onPointerOver);
  }, [active, sidebarRef, clearTimers, scheduleLeaveClose]);
}
