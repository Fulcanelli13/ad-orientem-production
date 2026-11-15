/**
 * Complete Angelus paint-review part attribution loader.
 * One work may be a candidate for several prayer parts.
 * Always returns editorial metadata; never a runtime painting default.
 */
export const ANGELUS_PART_REGISTRY_SCHEMA = 'ao.prayers.angelus-part-painting-registry.v1';

export async function loadAngelusPartPaintings(
  url = new URL('./angelus-part-paintings.v1.json', import.meta.url)
) {
  const response = await fetch(url);
  if (!response.ok) throw new Error('Angelus painting registry unavailable: ' + response.status);
  const registry = await response.json();
  validateAngelusPartPaintings(registry);
  return registry;
}

export function validateAngelusPartPaintings(registry) {
  if (registry?.schema !== ANGELUS_PART_REGISTRY_SCHEMA ||
      !Array.isArray(registry.artworks) ||
      !Array.isArray(registry.part_artwork_links) ||
      !Array.isArray(registry.editorial_parts)) {
    throw new Error('Incompatible Angelus part-artwork registry');
  }
  const ids = new Set();
  for (const art of registry.artworks) {
    if (!art.artwork_id || ids.has(art.artwork_id)) {
      throw new Error('Duplicate or missing artwork ID');
    }
    ids.add(art.artwork_id);
    if (art.primary_card_assignment !== null ||
        art.publication_status !== 'NOT_AUTO_PUBLISHABLE') {
      throw new Error('Implicit painting activation forbidden: ' + art.artwork_id);
    }
  }
  const groups = new Map(registry.editorial_parts.map(p => [p.part_id, p]));
  if (groups.size !== registry.editorial_parts.length) {
    throw new Error('Duplicate prayer part');
  }
  const links = new Set();
  const perPart = new Map();
  for (const link of registry.part_artwork_links) {
    const key = link.part_id + '|' + link.artwork_id;
    if (links.has(key) || !ids.has(link.artwork_id) || !groups.has(link.part_id)) {
      throw new Error('Broken or duplicate prayer-part relation: ' + key);
    }
    links.add(key);
    perPart.set(link.part_id, (perPart.get(link.part_id) || 0) + 1);
    if (link.selected_as_stage_primary || link.local_image_release_approved) {
      throw new Error('Candidate incorrectly promoted to runtime');
    }
    if (['SCENE_CONTEXT', 'CONTEXTUAL_ALTERNATIVE'].includes(groups.get(link.part_id).kind) &&
        link.owner_approved_for_this_part !== false) {
      throw new Error('Context art cannot be promoted to prayer approval');
    }
  }
  for (const [key,group] of groups) {
    if ((perPart.get(key) || 0) !== group.artwork_count) {
      throw new Error('Incomplete review group: ' + key);
    }
  }
  if (ids.size !== 36 || links.size !== 47 || groups.size !== 9) {
    throw new Error('Incomplete 15 November Angelus painting review import');
  }
  return true;
}

export function angelusPaintingsForPart(registry, partId, {includeContext = false} = {}) {
  validateAngelusPartPaintings(registry);
  const group = registry.editorial_parts.find(p => p.part_id === partId);
  if (!group) return [];
  const arts = new Map(registry.artworks.map(a => [a.artwork_id, a]));
  return registry.part_artwork_links
    .filter(link => link.part_id === partId &&
      (includeContext || link.owner_approved_for_this_part))
    .map(link => Object.freeze({
      artwork_id: link.artwork_id,
      title: arts.get(link.artwork_id).title,
      artist: arts.get(link.artwork_id).artist,
      institution: arts.get(link.artwork_id).institution,
      rights_note: arts.get(link.artwork_id).source_rights_note,
      source_url: arts.get(link.artwork_id).source_url,
      existing_catalogue_id: arts.get(link.artwork_id).existing_master_catalogue_id,
      owner_selected_for_part: link.owner_approved_for_this_part,
      editorial_scope: link.editorial_scope,
      local_asset_in_repository: arts.get(link.artwork_id).local_binary?.source_repo_file ?? null,
      final_primary_for_stage: false
    }));
}

export function angelusPaintingPartsForArtwork(registry, artworkId) {
  validateAngelusPartPaintings(registry);
  return registry.part_artwork_links.filter(link => link.artwork_id === artworkId)
    .map(link => Object.freeze({
      part_id: link.part_id,
      part_label: link.part_label,
      scope: link.editorial_scope,
      owner_selected_for_part: link.owner_approved_for_this_part,
      candidate_stage_keys: [...link.applicable_editorial_stage_keys],
      final_primary_for_stage: false
    }));
}

/** Cross-referenced A1 stage candidates for editorial review, NOT for rendering. */
export function angelusPaintingOptionsForStage(registry, displayStageKey, {includeContext = false} = {}) {
  validateAngelusPartPaintings(registry);
  const ids = new Set(registry.part_artwork_links
    .filter(link => link.applicable_editorial_stage_keys.includes(displayStageKey) &&
      (includeContext || link.owner_approved_for_this_part))
    .map(link => link.artwork_id));
  return registry.artworks.filter(art => ids.has(art.artwork_id))
    .map(art => Object.freeze({
      artwork_id: art.artwork_id,
      title: art.title,
      artist: art.artist,
      editorial_parts: angelusPaintingPartsForArtwork(registry, art.artwork_id)
        .filter(p => p.candidate_stage_keys.includes(displayStageKey) &&
          (includeContext || p.owner_selected_for_part)),
      stage_primary: false,
      display_image_src: null
    }));
}
