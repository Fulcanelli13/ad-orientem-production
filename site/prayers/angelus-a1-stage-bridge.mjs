import {getApprovedCardArtworkOptions} from './card-artwork-resolver.mjs';

const SCHEMA = 'ao.prayers.angelus-regina-a1-crosswalk.v1';
const FORMS = new Set(['angelus', 'regina_caeli']);

export async function loadAngelusA1Crosswalk(
  url = new URL('./angelus-regina-a1-crosswalk.v1.json', import.meta.url)
) {
  const response = await fetch(url);
  if (!response.ok) throw new Error('Angelus donor crosswalk unavailable: ' + response.status);
  const data = await response.json();
  validateAngelusA1Crosswalk(data);
  return data;
}

export function validateAngelusA1Crosswalk(data) {
  if (data?.schema !== SCHEMA || !Array.isArray(data.stages)) {
    throw new Error('Unknown Angelus A1 crosswalk schema');
  }
  const stages = new Set();
  for (const stage of data.stages) {
    if (!FORMS.has(stage.form)) throw new Error('Unknown canonical Marian form');
    if (!stage.stage_id || !Array.isArray(stage.unit_indices) || !Array.isArray(stage.units)) {
      throw new Error('Incomplete A1 stage');
    }
    if (!stage.display_card_key || stages.has(stage.display_card_key)) {
      throw new Error('Missing or duplicate A1 stage key');
    }
    stages.add(stage.display_card_key);
    if (stage.runtime_card_id !== null || stage.verified_runtime_card_id !== false ||
        stage.primary_artwork_id !== null) throw new Error('Unapproved prayer stage activation');
    for (const unit of stage.units) {
      if (!unit.editorial_card_key || !unit.legacy_editorial_id) {
        throw new Error('Unidentified source-owned prayer unit');
      }
      if (unit.subtype === 'ave_maria' && unit.exact_approved_artwork_binding !== 'NONE') {
        throw new Error('Parent Hail Mary painting cannot become stage primary');
      }
    }
  }
  if (stages.size !== 9 ||
      data.stages.filter(s => s.form === 'angelus').length !== 5 ||
      data.stages.filter(s => s.form === 'regina_caeli').length !== 4) {
    throw new Error('A1 storyboard/card counts differ from source');
  }
  return true;
}

export function angelusA1Movements(data, form, {historicalConclusion = true} = {}) {
  validateAngelusA1Crosswalk(data);
  if (!FORMS.has(form)) throw new RangeError('Invalid Marian form');
  return data.stages.filter(s => s.form === form && (historicalConclusion || !s.optional))
    .map(s => ({
      key: s.display_card_key,
      stage_id: s.stage_id,
      latin: s.latin,
      canonical_unit_indices: [...s.unit_indices],
      has_optional_conclusion: Boolean(s.optional),
      runtime_card_id: null
    }));
}

/**
 * Exact owner-approved art is tracked against source prayer UNITS.
 * For A1, Intercessio and the Collect share one screen; a Collect choice
 * must never be taken as approval of the entire screen background.
 */
export function angelusA1ApprovedUnitOptions(crosswalk, cardArtworkManifest, displayCardKey) {
  validateAngelusA1Crosswalk(crosswalk);
  const stage = crosswalk.stages.find(s => s.display_card_key === displayCardKey);
  if (!stage) return [];
  return stage.units.flatMap(u =>
    u.exact_approved_artwork_binding === 'EXACT_SUBUNIT_ONLY__NEVER_STAGE_PRIMARY'
      ? getApprovedCardArtworkOptions(cardArtworkManifest, u.editorial_card_key)
        .map(opt => ({
          ...opt,
          unit: u.subtype,
          source_editorial_key: u.editorial_card_key,
          release_as_stage_background: false,
          source_scope: 'EXACT_SUBUNIT_ONLY'
        }))
      : []
  );
}
