export function computeSomaticDelta(snapshotA, snapshotB) {
  if (!snapshotA || !snapshotB) return null

  const zonesA = new Set(snapshotA.somatic.selectedZones ?? [])
  const zonesB = new Set(snapshotB.somatic.selectedZones ?? [])
  const qualitiesA = new Set(snapshotA.somatic.qualityTags ?? [])
  const qualitiesB = new Set(snapshotB.somatic.qualityTags ?? [])

  return {
    intensityDelta: (snapshotB.somatic.intensity ?? 0) - (snapshotA.somatic.intensity ?? 0),
    valenceDelta: (snapshotB.somatic.valence ?? 0) - (snapshotA.somatic.valence ?? 0),
    zonesAdded: [...zonesB].filter((zone) => !zonesA.has(zone)),
    zonesRemoved: [...zonesA].filter((zone) => !zonesB.has(zone)),
    qualityAdded: [...qualitiesB].filter((tag) => !qualitiesA.has(tag)),
    qualityRemoved: [...qualitiesA].filter((tag) => !qualitiesB.has(tag)),
  }
}

export function hasSomaticSignal(somatic) {
  if (!somatic) return false
  return (somatic.selectedZones?.length ?? 0) > 0 || (somatic.intensity ?? 0) > 0
}
