import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/features/auth/useAuth'
import { catalogueQueryOptions } from '../api/query'
import type { CatalogueAgent, CatalogueCategory } from '../api/types'

export interface AutoCatalogueOption {
  slug: null
  displayName: string
  shortDescription: string
  agentType: 'auto'
  iconUrl: null
}

export const AUTO_CATALOGUE_OPTION: AutoCatalogueOption = {
  slug: null,
  displayName: 'Auto',
  shortDescription: 'Best agent and model for the task',
  agentType: 'auto',
  iconUrl: null,
}

export type CataloguePickerOption = AutoCatalogueOption | CatalogueAgent

export interface UseCatalogueResult {
  categories: CatalogueCategory[]
  agents: CatalogueAgent[]
  autoOption: AutoCatalogueOption
  isLoading: boolean
  isError: boolean
  error: unknown
}

function flattenAgents(categories: CatalogueCategory[]): CatalogueAgent[] {
  return categories.flatMap((category) => category.agents)
}

export function useCatalogue(): UseCatalogueResult {
  const { status } = useAuth()
  const query = useQuery(catalogueQueryOptions(status === 'authenticated'))
  const categories = query.data?.categories
  const agents = useMemo(() => flattenAgents(categories ?? []), [categories])

  return {
    categories: categories ?? [],
    agents,
    autoOption: AUTO_CATALOGUE_OPTION,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
  }
}
