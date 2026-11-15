/**
 * Safe artwork bridge for the future Claude prayer UI.
 * It reads explicit editorial stage keys; no guessed STG/COV runtime IDs,
 * no automatic default or publication of source research candidates.
 */
const SCHEMA = 'ao.prayers.artwork-card-bindings.v1';

export async function loadPrayerArtworkManifest(
  url = new URL('./card-artwork-bindings.v1.json', import.meta.url)
) {
  const response = await fetch(url);
  if (!response.ok) throw new Error('Prayer-artwork manifest unavailable: ' + response.status);
  const manifest = await response.json();
  validatePrayerArtworkManifest(manifest);
  return manifest;
}

export function validatePrayerArtworkManifest(manifest) {
  if (manifest?.schema !== SCHEMA || !Array.isArray(manifest.cards)) {
    throw new Error('Incompatible prayer-artwork manifest');
  }
  const keys = new Set();
  for (const card of manifest.cards) {
    if (typeof card.card_key !== 'string' || !card.card_key || keys.has(card.card_key)) {
      throw new Error('Duplicate or missing prayer card key');
    }
    keys.add(card.card_key);
    if (!Array.isArray(card.approved_exact_candidates)) {
      throw new Error('Missing candidate list for ' + card.card_key);
    }
    const candidates = new Set();
    for (const art of card.approved_exact_candidates) {
      if (!art.artwork_id || candidates.has(art.artwork_id)) {
        throw new Error('Duplicate / missing artwork candidate: ' + card.card_key);
      }
      candidates.add(art.artwork_id);
    }
    if (card.reviewed_stage_image_primary !== null &&
        !candidates.has(card.reviewed_stage_image_primary)) {
      throw new Error('Primary not in approved candidate list: ' + card.card_key);
    }
    if (!card.owner_selected_primary && card.reviewed_stage_image_primary !== null) {
      throw new Error('Primary recorded without owner selection: ' + card.card_key);
    }
  }
  return true;
}

export function findPrayerCard(manifest, editorialCardKey) {
  validatePrayerArtworkManifest(manifest);
  return manifest.cards.find(c => c.card_key === editorialCardKey) ?? null;
}

/** Returns editorial choices, never a displayed image or selected default. */
export function getApprovedCardArtworkOptions(manifest, editorialCardKey) {
  const card = findPrayerCard(manifest, editorialCardKey);
  if (!card) return [];
  return card.approved_exact_candidates.map(c => ({
    artwork_id: c.artwork_id,
    title: c.title,
    artist: c.artist,
    source_url: c.source_url,
    site_asset_path: c.local_asset?.file ?? null,
    release_state: c.image_release_state,
    photo_qa: c.local_asset?.photo_qa ?? 'MISSING_LOCAL_IMAGE'
  }));
}

/**
 * Fail closed. A selected painting may only become a runtime background
 * after card identity, owner primary choice, local binary and photo QA pass.
 */
export function resolvePrayerCardArtwork(manifest, editorialCardKey, runtimeCardId) {
  const card = findPrayerCard(manifest, editorialCardKey);
  if (!card || !runtimeCardId || !card.production_runtime_verified ||
      card.production_runtime_card_id !== runtimeCardId ||
      !card.owner_selected_primary || !card.reviewed_stage_image_primary) return null;
  const choice = card.approved_exact_candidates.find(
    c => c.artwork_id === card.reviewed_stage_image_primary
  );
  if (!choice || choice.image_release_state !== 'PUBLISHED_QA_APPROVED' ||
      !choice.local_asset?.file || choice.local_asset.card_use_authorized !== true ||
      choice.local_asset.photo_qa !== 'PASSED_MOBILE_CINEMATIC_QA') return null;
  return Object.freeze({
    artwork_id: choice.artwork_id,
    title: choice.title,
    artist: choice.artist,
    src: new URL('../' + choice.local_asset.file, import.meta.url).href
  });
}
