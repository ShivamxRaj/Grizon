export interface SharedLink {
  id: string
  title: string
  created: string
  views: number
}

export const RETENTION_OPTIONS = [
  { value: 'forever', label: 'Forever' },
  { value: '12m', label: '12 months' },
  { value: '6m', label: '6 months' },
  { value: '30d', label: '30 days' },
]

export const SHARED_LINKS: SharedLink[] = [
  { id: 'link-q3', title: 'Q3 campaign brief', created: '14 Jul 2026', views: 23 },
  { id: 'link-audit', title: 'Sidebar accessibility audit', created: '2 Jul 2026', views: 6 },
]
