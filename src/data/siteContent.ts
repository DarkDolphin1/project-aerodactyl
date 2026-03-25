import { roms } from './romCatalog'
import siteContentData from '../content/site/site-content.json'
import type { GcamEntry, SiteContentData } from './types'

export { roms }

export const quickStats = [
  { label: 'ROMs tracked', value: `${roms.length} ROMs` },
  { label: 'Supported devices', value: '2 devices' },
  { label: 'Release flow', value: 'Per-ROM tracking' },
]

const siteContent = siteContentData as SiteContentData

export const communityHub = siteContent.communityHub

export const sourceChanges = siteContent.sourceChanges

export const builderUpdates = siteContent.builderUpdates

export const supportMatrix = siteContent.supportMatrix

export const expansionCards = siteContent.expansionCards

export const gcamEntries = siteContent.gcamEntries

export const comments = siteContent.comments

type LatestUpdate = {
  title: string
  date: string
  category: string
  href: string
}

function toTimestamp(value: string) {
  const parsed = Date.parse(value)
  return Number.isNaN(parsed) ? 0 : parsed
}

function toSectionId(name: string) {
  return `rom-${name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}`
}

function toGcamHref(entry: GcamEntry) {
  return entry.downloadUrl || entry.configUrl || '#gcams'
}

export const latestUpdates: LatestUpdate[] = [
  ...roms.map((rom) => ({
    title: `${rom.name} ${rom.version}`,
    date: rom.buildDate,
    category: 'ROM',
    href: `#${toSectionId(rom.name)}`,
  })),
  ...sourceChanges.map((entry) => ({
    title: entry.title,
    date: entry.date,
    category: 'Source',
    href: '#source-pulse',
  })),
  ...builderUpdates.map((entry) => ({
    title: entry.title,
    date: entry.date,
    category: 'Builder',
    href: '#builder-notes',
  })),
  ...gcamEntries.map((entry) => ({
    title: `${entry.name} ${entry.build}`,
    date: entry.updatedAt,
    category: 'GCam',
    href: toGcamHref(entry),
  })),
]
  .sort((left, right) => toTimestamp(right.date) - toTimestamp(left.date))
  .slice(0, 6)
