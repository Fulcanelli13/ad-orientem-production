/* Permanent Sacred Art Catalogue (v1).
 * Renders one canonical registry record per entry; displays only exact local image files.
 * The original scene/prayer matching registry is read-only: no stage defaults or approvals change.
 */
(() => {
  "use strict";
  const root = document.getElementById("gallery-view");
  if (!root) return;
  const byId = id => document.getElementById(id);
  const grid = byId("gallery-grid");
  const note = byId("gallery-results-status");
  const more = byId("gallery-more");
  const search = byId("gallery-search");
  const filters = [...root.querySelectorAll("[data-gallery-filter]")];
  const dialog = byId("gallery-detail-dialog");
  const dataUrl = "./gallery/catalogue.v1.json";
  const pageSize = 30;
  let catalogue = null;
  let pending = null;
  let filter = "display";
  let visible = [];
  let limit = pageSize;

  function selectedRecords() {
    if (!catalogue) return [];
    let rows = catalogue.records;
    if (filter === "display") {
      const unique = new Set();
      rows = rows.filter(item => {
        const file = item.image?.src;
        if (!file || unique.has(file)) return false;
        unique.add(file);
        return true;
      });
    } else if (filter === "selected") {
      rows = rows.filter(item => item.owner_selected_artwork);
    } else if (filter === "angelus") {
      rows = rows.filter(item => item.prayer_parts?.length);
    } else if (filter === "matched") {
      rows = rows.filter(item =>
        item.exact_prayer_cards?.length ||
        item.prayer_parts?.some(part => part.approved_for_part)
      );
    } else if (filter === "missing") {
      rows = rows.filter(item => !item.image?.src);
    }
    const q = search.value.trim().toLocaleLowerCase();
    if (q) {
      rows = rows.filter(item => [
        item.title, item.artist, item.institution, item.record_status,
        ...(item.scene_ids || []),
        ...(item.prayer_parts || []).map(part => part.label)
      ].some(text => String(text || "").toLocaleLowerCase().includes(q)));
    }
    rows = [...rows];
    rows.sort((a,b) =>
      Number(!!b.image?.src) - Number(!!a.image?.src) ||
      Number(b.owner_selected_artwork) - Number(a.owner_selected_artwork) ||
      displayTitle(a).localeCompare(displayTitle(b)) ||
      a.artist.localeCompare(b.artist)
    );
    return rows;
  }

  function textEl(tag, className, value) {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (value !== undefined && value !== null) el.textContent = String(value);
    return el;
  }

  // Preserve the historic catalogue fields; only clean imported Wiki QS tags in presentation.
  function displayTitle(item) {
    const original = String(item.title || "Untitled");
    const cleaned = original
      .replace(/\s*(?:title|label)\s*QS\s*:[\s\S]*$/i,"")
      .replace(/^(?:English|French|Dutch|German|Spanish)\s*:\s*/i,"")
      .trim();
    return cleaned || original;
  }

  function card(item) {
    const hasImage = Boolean(item.image?.src);
    const el = textEl("button","gallery-piece " + (hasImage ? "has-image" : "catalogue-only"));
    el.type = "button";
    el.dataset.galleryId = item.id;
    el.setAttribute("aria-label", "View artwork details: " + displayTitle(item) + " by " + item.artist);
    if (hasImage) {
      const frame = textEl("span","artwork-thumb");
      const img = document.createElement("img");
      img.src = item.image.src;
      img.alt = displayTitle(item) + ", " + item.artist;
      img.loading = "lazy";
      img.decoding = "async";
      img.addEventListener("error", () => {
        img.remove();
        frame.append(textEl("span","gallery-artist","Image unavailable"));
      },{once:true});
      frame.append(img);
      el.append(frame);
    }
    const caption = textEl("span","gallery-caption");
    caption.append(textEl("strong","",displayTitle(item)),textEl("span","gallery-artist",item.artist));
    if (hasImage && item.image?.photographer) caption.append(textEl("span","gallery-photo-credit","Photo: " + item.image.photographer + " · " + item.image.license));
    if (hasImage) {
      caption.append(textEl("span","gallery-type",
        item.image?.quality?.startsWith("LOW_RES_PREVIEW") ? "CURATED · PREVIEW IMAGE" :
        item.owner_selected_artwork ? "CURATED · LOCAL IMAGE" : "LOCAL IMAGE"));
    } else {
      caption.append(textEl("span","gallery-type",
        item.owner_selected_artwork ? "CURATED RECORD" : "CATALOGUE RECORD"));
    }
    el.append(caption);
    if (!hasImage) el.append(textEl("span","catalogue-marker","Image pending"));
    return el;
  }

  function render() {
    if (!catalogue) return;
    visible = selectedRecords();
    grid.replaceChildren();
    const fragment = document.createDocumentFragment();
    for (const item of visible.slice(0,limit)) fragment.append(card(item));
    grid.append(fragment);
    if (!visible.length) grid.append(textEl("p","gallery-empty","No paintings match this search."));
    more.hidden = visible.length <= limit;
    note.textContent = visible.length.toLocaleString() +
      (visible.length === 1 ? " artwork record" : " artwork records") +
      " · " + Math.min(visible.length,limit).toLocaleString() + " shown" +
      (filter === "missing" ? " · originals being acquired progressively" : "");
    filters.forEach(button =>
      button.setAttribute("aria-pressed", String(button.dataset.galleryFilter === filter))
    );
  }

  function setFilter(next) {
    filter = next;
    limit = pageSize;
    render();
  }

  function detailMeta(label, value) {
    const p = textEl("p","gallery-detail-meta");
    p.append(textEl("b","",label + " "),document.createTextNode(value || "Not documented"));
    return p;
  }

  function openDetail(id) {
    if (!catalogue) return;
    const item = catalogue.records.find(x => x.id === id);
    if (!item) return;
    byId("gallery-detail-body").replaceChildren();
    const body = byId("gallery-detail-body");
    if (item.image?.src) {
      const img = document.createElement("img");
      img.className = "gallery-detail-image";
      img.alt = displayTitle(item) + ", " + item.artist;
      img.src = item.image.src;
      img.decoding = "async";
      body.append(img);
    }
    const inside = textEl("div","gallery-detail-content");
    inside.append(textEl("h2","",displayTitle(item)),
      textEl("p","gallery-detail-artist",item.artist));
    if (item.institution) inside.append(detailMeta("Collection:",item.institution));
    inside.append(detailMeta("Gallery:",
      item.image?.quality?.startsWith("LOW_RES_PREVIEW")
        ? "Permanent local preview; high-resolution museum original still pending" :
      item.image?.src ? "Reproduction held permanently in the app" :
        "Artwork record catalogued; local reproduction pending acquisition"));
    inside.append(detailMeta("Curation:",
      item.owner_selected_artwork ? "Owner-selected artwork (not a prayer-card primary)" :
        "Historical or research catalogue record; approval scope preserved"));
    if (item.image?.provenance) inside.append(detailMeta("Image provenance:",item.image.provenance));
    if (item.image?.scene_use_note) inside.append(detailMeta("Scene context:",item.image.scene_use_note));
    if (item.image?.source_note) inside.append(detailMeta("Photo reuse caveat:",item.image.source_note));
    if (item.calendar_placements?.length) inside.append(detailMeta("Approved 2026 Calendar date:",item.calendar_placements.map(x=>x.date+" · "+x.occasion).join("; ")));
    if (item.image?.photographer) inside.append(detailMeta("Photograph:",item.image.photographer));
    if (item.image?.adaptation) inside.append(detailMeta("Adaptation:",item.image.adaptation));
    if (item.image?.license_url) {
      const licence = textEl("a","gallery-detail-source","Image licence: " + item.image.license);
      licence.href = item.image.license_url;
      licence.target = "_blank";
      licence.rel = "noopener noreferrer";
      inside.append(licence);
    }
    if (item.image?.quality?.startsWith("LOW_RES_PREVIEW"))
      inside.append(detailMeta("Image quality:","Low-resolution preview only. Do not upscale or use for prayer cinematic backgrounds."));
    if (item.image?.usage?.includes("PRAYER_QA_PENDING"))
      inside.append(detailMeta("Prayer use:","Cinematic photograph and individual prayer-card approval remain pending"));
    if (item.rights_note) inside.append(detailMeta("Historical catalogue rights note:",item.rights_note));
    const parts = (item.prayer_parts || []);
    if (parts.length) {
      inside.append(textEl("p","gallery-detail-meta","Existing prayer-part associations:"));
      const tags = textEl("div","gallery-detail-parts");
      for (const part of parts) {
        tags.append(textEl("span","gallery-detail-part",
          part.label + (part.approved_for_part ? "" : " · context only")));
      }
      inside.append(tags);
    }
    if (item.exact_prayer_cards?.length)
      inside.append(detailMeta("Exact approved prayer-card associations:",
        item.exact_prayer_cards.join(", ")));
    if (item.eligible_card_count)
      inside.append(detailMeta("Historical candidate links:",
        String(item.eligible_card_count) + " (not necessarily approved)"));
    if (item.scene_ids?.length)
      inside.append(detailMeta("Source scene categories:",item.scene_ids.join(", ")));
    if (item.source_url) {
      const a = textEl("a","gallery-detail-source","View artwork source");
      a.href = item.source_url;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      inside.append(a);
    }
    body.append(inside);
    if (dialog.open) dialog.close();
    dialog.showModal();
  }

  async function load() {
    if (catalogue) return;
    if (pending) return pending;
    note.textContent = "Loading the permanent gallery catalogue…";
    pending = (async () => {
      try {
        const response = await fetch(dataUrl,{cache:"no-cache"});
        if (!response.ok) throw new Error("HTTP " + response.status);
        const data = await response.json();
        if (data.schema !== "ao.sacred-art.gallery.v1" ||
            data.records?.length !== data.counts?.total_records ||
            data.records?.length !== 873) throw new Error("Invalid artwork catalogue");
        const ids = new Set();
        for (const art of data.records) {
          if (!art.id || ids.has(art.id) ||
              (art.image?.src && !/^\.\/(?:artwork|gallery\/images)\/[a-zA-Z0-9_.-]+$/.test(art.image.src))) {
            throw new Error("Invalid artwork identity or local image link");
          }
          ids.add(art.id);
        }
        // V21 release-gated: nine vetted draft gallery images (eight new records, one existing-record patch).\n        // Other selected photos remain research-only. Historical 873-row source catalogue remains untouched. V13/V14
        // augment only the gallery, never the prayer-card activation registry.
        const legacyRecordCount = data.records.length;
        let addedRecords = 0, addedImages = 0;
        for (const [filename, schema, requiredRecords, expectedPatches] of [
          ["selected31-reviewed-images.v13.json", "ao.sacred-art.selected31-gallery-overlay.v13", 5, 0],
          ["selected31-reviewed-images.v14.json", "ao.sacred-art.selected31-gallery-overlay.v14", 1, 1],
          ["selected31-reviewed-images.v20.json", "ao.sacred-art.selected31-gallery-overlay.v20", 1, 0],
          ["selected31-reviewed-images.v21.json", "ao.sacred-art.selected31-gallery-overlay.v21", 1, 0]
        ]) {
          const response = await fetch("./gallery/" + filename, {cache:"no-cache"});
          if (!response.ok) throw new Error("Review gallery data unavailable: " + filename);
          const supplement = await response.json();
          if (supplement.schema !== schema ||
              supplement.baseline_registry_count !== 862 ||
              supplement.canonical_master_unchanged !== true ||
              supplement.records?.length !== requiredRecords ||
              (supplement.image_patches || []).length !== expectedPatches) {
            throw new Error("Invalid supplementary gallery data: " + filename);
          }
          for (const art of supplement.records) {
            if (!art.id?.startsWith("REVIEW31::") || ids.has(art.id) ||
                !/^\.\/gallery\/images\/selected31-(?:v14-|v20-|v21-)?[a-zA-Z0-9_.-]+$/.test(art.image?.src || "") ||
                art.owner_selected_artwork !== true ||
                art.exact_prayer_cards?.length || art.prayer_parts?.length ||
                art.parent_prayer_candidates?.length || art.eligible_card_count) {
              throw new Error("Supplemental artwork violates editorial boundary");
            }
            ids.add(art.id);
            data.records.push(art);
            addedRecords++;
            addedImages++;
          }
          for (const patch of supplement.image_patches || []) {
            const original = data.records.find(art => art.id === patch.id);
            if (!original || original.image ||
                original.source_url !== patch.expected_source_url ||
                !/^\.\/gallery\/images\/selected31-v14-[a-zA-Z0-9_.-]+$/.test(patch.image?.src || "") ||
                !original.owner_selected_artwork) {
              throw new Error("Supplemental image patch fails canonical identity check");
            }
            original.image = patch.image;
            addedImages++;
          }
        }
        if (legacyRecordCount !== 873 || addedRecords !== 8 || addedImages !== 9) {
          throw new Error("Unexpected historical gallery reconciliation counts");
        }
        data.counts.total_records += addedRecords;
        data.counts.selected_artwork_records += addedRecords;
        data.counts.image_available_records += addedImages;
        data.counts.distinct_locally_hosted_paintings += addedImages;
        data.counts.verified_image_files += addedImages;
        catalogue = data;
        byId("gallery-total-count").textContent = data.counts.total_records.toLocaleString();
        byId("gallery-photo-count").textContent = data.counts.distinct_locally_hosted_paintings.toLocaleString();
        byId("gallery-angelus-count").textContent = data.counts.angelus_review_records.toLocaleString();
        render();
      } catch (err) {
        note.textContent = "Gallery data unavailable.";
        grid.replaceChildren(textEl("p","gallery-error","Could not load gallery records: " + err.message));
      } finally {
        pending = null;
      }
    })();
    return pending;
  }
  filters.forEach(b => b.addEventListener("click",() => setFilter(b.dataset.galleryFilter)));
  search.addEventListener("input",() => {
    if (search.value.trim() && filter === "display") filter = "all";
    limit = pageSize;
    render();
  });
  more.addEventListener("click",() => {limit += pageSize;render();});
  grid.addEventListener("click",event => {
    const button = event.target.closest("[data-gallery-id]");
    if (button) openDetail(button.dataset.galleryId);
  });
  byId("gallery-detail-close").addEventListener("click",()=>dialog.close());
  dialog.addEventListener("click",event => {
    if (event.target === dialog) dialog.close();
  });
  window.AO_OPEN_SACRED_ART_GALLERY = load;
  if (!root.hidden) load();
})();
