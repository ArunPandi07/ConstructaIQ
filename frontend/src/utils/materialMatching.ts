import type { ProjectSupplierRow, ScheduleMaterial } from '../types'

const STOP_WORDS = new Set([
  'a',
  'an',
  'the',
  'and',
  'or',
  'with',
  'for',
  'of',
  'in',
  'on',
  'to',
  'by',
  'per',
])

const MATERIAL_KEYWORDS = new Set([
  'concrete',
  'steel',
  'rebar',
  'reinforced',
  'structural',
  'ready',
  'mix',
  'high',
  'strength',
  'curtain',
  'wall',
  'glazing',
  'glass',
  'elevator',
  'aluminum',
  'timber',
  'wood',
  'masonry',
  'brick',
  'gypsum',
  'insulation',
  'roofing',
  'membrane',
  'copper',
  'stainless',
  'precast',
  'aggregate',
  'cement',
  'mortar',
  'pipe',
  'pvc',
  'duct',
  'hvac',
  'plumbing',
  'cable',
  'wiring',
  'drywall',
  'shingle',
  'asphalt',
  'stone',
  'granite',
  'marble',
  'tile',
  'ceramic',
  'framing',
  'beam',
  'column',
  'truss',
  'deck',
  'slab',
  'foundation',
  'footing',
  'psi',
  'core',
  'walls',
])

export const MIN_MATCH_SCORE = 0.45

export function materialName(material: ScheduleMaterial): string {
  return material.materialName ?? material.name ?? 'Material'
}

function normalize(value: unknown): string {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
}

function materialTokens(text: string): Set<string> {
  const tokens = normalize(text).split(/\s+/).filter(Boolean)
  return new Set(
    tokens.filter((token) => !STOP_WORDS.has(token) && !/^\d+$/.test(token)),
  )
}

export function scoreMaterialMatch(a: string, b: string): number {
  if (!a || !b) return 0
  if (normalize(a) === normalize(b)) return 1

  const tokensA = materialTokens(a)
  const tokensB = materialTokens(b)
  if (tokensA.size === 0 || tokensB.size === 0) return 0

  const intersection = [...tokensA].filter((token) => tokensB.has(token))
  if (intersection.length === 0) return 0

  let overlap = intersection.length / Math.max(tokensA.size, tokensB.size)
  const smaller = tokensA.size <= tokensB.size ? tokensA : tokensB
  const larger = tokensA.size <= tokensB.size ? tokensB : tokensA
  if ([...smaller].every((token) => larger.has(token))) {
    overlap = Math.max(overlap, smaller.size / larger.size, 0.45)
  }
  const keywordBonus = intersection.reduce(
    (sum, token) => sum + (MATERIAL_KEYWORDS.has(token) ? 0.05 : 0),
    0,
  )
  return Math.min(1, overlap + keywordBonus)
}

export function findSupplier(
  material: ScheduleMaterial,
  supplierRows: ProjectSupplierRow[],
): ProjectSupplierRow | undefined {
  if (material.supplierRecordId != null) {
    const byId = supplierRows.find(
      (row) => row.supplier_record_id === material.supplierRecordId,
    )
    if (byId) return byId
  }

  const target = materialName(material)
  if (!target) return undefined

  let best: ProjectSupplierRow | undefined
  let bestScore = 0

  for (const supplier of supplierRows) {
    const supplierMaterial = supplier.material_name ?? ''
    const score = scoreMaterialMatch(target, supplierMaterial)
    if (score >= MIN_MATCH_SCORE && score > bestScore) {
      bestScore = score
      best = supplier
    }
  }

  return best
}

export function formatMoney(value: unknown): string {
  if (value == null || value === '') return '-'
  const num = Number(value)
  return Number.isFinite(num) ? `$${num.toLocaleString()}` : String(value)
}

export function formatQuantity(
  material: ScheduleMaterial,
  supplier?: ProjectSupplierRow,
): string {
  const quantity =
    material.quantity != null && material.quantity !== ''
      ? material.quantity
      : supplier?.quantity
  if (quantity == null || quantity === '') return '-'
  const unit = material.unit || (supplier?.quantity != null ? 'EA' : '')
  return `${quantity} ${unit}`.trim()
}

export function resolveMaterialCost(
  material: ScheduleMaterial,
  supplier?: ProjectSupplierRow,
): number | null {
  if (material.totalCost != null && material.totalCost !== '') {
    const value = Number(material.totalCost)
    return Number.isFinite(value) ? value : null
  }
  if (supplier?.total_cost != null && supplier.total_cost !== '') {
    const value = Number(supplier.total_cost)
    return Number.isFinite(value) ? value : null
  }
  const qty = Number(
    material.quantity != null && material.quantity !== ''
      ? material.quantity
      : supplier?.quantity,
  )
  const unitPrice = Number(supplier?.unit_price)
  if (Number.isFinite(qty) && Number.isFinite(unitPrice)) {
    return qty * unitPrice
  }
  return null
}
