import type { CSSProperties, JSX } from 'react';
import { cn } from '@/lib/utils/cn';
import { useAuth } from '@/features/auth/useAuth';
import { useCredits } from '@/features/billing/useCredits';
import { useSettingsModal } from '@/features/settings/useSettingsModal';

interface SidebarAccountProps {
  expanded: boolean;
}

function formatK(value: number): string {
  if (value >= 1000)
    return `${(value / 1000).toFixed(value >= 10000 ? 0 : 1)}k`;
  return String(value);
}

export function SidebarAccount({ expanded }: SidebarAccountProps): JSX.Element {
  const { user } = useAuth();
  const { openSettings } = useSettingsModal();
  const { balance, subscription, usageSummary } = useCredits();

  const name = user?.name?.trim() || user?.email || 'Account';
  const planName = subscription?.planSnapshot?.name ?? 'Free';
  const included = subscription?.planSnapshot?.credits?.included ?? 0;
  const used = usageSummary?.credits_used ?? balance?.lifetimeSpent ?? 0;
  const spendable = balance?.available ?? 0;
  const limit = Math.max(included, 1);
  const usagePercent = Math.min(100, Math.round((used / limit) * 100));
  const exhausted = used >= included && spendable <= 0;
  const summary = `${name} · ${planName} · ${formatK(spendable)} credits`;

  return (
    <button
      type='button'
      onClick={() => openSettings(exhausted ? 'billing' : 'usage')}
      aria-label={`${summary}. Open ${exhausted ? 'billing' : 'usage'} settings.`}
      data-tooltip={expanded ? undefined : summary}
      style={{ '--usage': usagePercent } as CSSProperties}
      className={cn(
        'chat-tooltip relative flex items-center gap-xs rounded-card text-left transition-all duration-short ease-out border border-transparent',
        expanded
          ? 'w-full justify-start p-2.5 bg-paper-2/60 border-[var(--glass-stroke)] shadow-sm hover:border-accent-text/30 hover:bg-paper-2'
          : 'h-10 w-10 justify-center rounded-full hover:bg-[var(--sb-hover)]',
      )}
    >
      <span
        className={cn(
          'chat-usage-ring grid flex-none place-items-center rounded-full',
          expanded ? 'h-6.5 w-6.5' : 'h-8 w-8 p-[3px]',
        )}
      >
        <span className='grid h-full w-full flex-none place-items-center rounded-full bg-accent-soft font-display text-xs font-bold text-accent-text'>
          {name.charAt(0).toUpperCase()}
        </span>
      </span>

      {expanded && (
        <span className='min-w-0 flex-1 leading-tight'>
          <b className='block truncate font-display text-[0.82rem] font-semibold text-ink'>
            {name}
          </b>
          <span className='mt-px flex items-baseline justify-between gap-2xs'>
            <span className='truncate text-[0.7rem] text-muted'>
              {planName}
            </span>
            <span className='flex-none text-[0.66rem] font-semibold tabular-nums text-accent-text'>
              {formatK(spendable)} tokens
            </span>
          </span>
          <span
            className='mt-[0.35rem] block h-[3px] overflow-hidden rounded-pill bg-[var(--sb-hover)]'
            aria-hidden='true'
          >
            <span
              className='chat-usage-meter-fill block h-full rounded-[inherit]'
              style={{
                background:
                  'linear-gradient(90deg, var(--color-accent-cool), var(--color-accent))',
              }}
            />
          </span>
        </span>
      )}
    </button>
  );
}
