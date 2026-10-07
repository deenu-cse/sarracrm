"use client";
import React, { useState } from 'react';
import { Lock } from 'lucide-react';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import {
  fetchDistricts, fetchBlocks, fetchGramPanchayats, fetchVillages,
  createBlock, createGramPanchayat, createVillage,
} from '@/lib/projectApi';
import { AddMasterDialog } from './AddMasterDialog';
import { Field, Notice, StepCard, useMasterList } from './parts';

/** Step 1 — District → Block → Gram Panchayat → Village. */
export function StepLocation({ state, dispatch, errors, showErrors }) {
  const { district, block, gramPanchayat, village } = state.location;
  const districtLocked = Boolean(state.projectId);
  const existingProject = state.mode !== 'create';

  // Each list is loaded for its own parent only, so unrelated children never appear.
  const districts = useMasterList(fetchDistricts, 'districts');
  const blocks = useMasterList(() => fetchBlocks(district.id), district ? district.id : null);
  const gramPanchayats = useMasterList(() => fetchGramPanchayats(block.id), block ? block.id : null);
  const villages = useMasterList(() => fetchVillages(gramPanchayat.id), gramPanchayat ? gramPanchayat.id : null);

  const [addConfig, setAddConfig] = useState(null);

  const setLevel = (level, value) => dispatch({
    type: 'SET_LOCATION',
    level,
    value: value ? { id: value.id, name: value.name } : null,
  });

  const openAdd = (level, initialName) => {
    const configs = {
      block: {
        noun: 'Block',
        context: [{ label: 'District', value: district?.name }],
        existing: blocks.items,
        create: (name) => createBlock(district.id, name),
        reload: blocks.reload,
      },
      gramPanchayat: {
        noun: 'Gram Panchayat',
        context: [{ label: 'District', value: district?.name }, { label: 'Block', value: block?.name }],
        existing: gramPanchayats.items,
        create: (name) => createGramPanchayat(block.id, name),
        reload: gramPanchayats.reload,
      },
      village: {
        noun: 'Village',
        context: [
          { label: 'District', value: district?.name },
          { label: 'Block', value: block?.name },
          { label: 'Gram Panchayat', value: gramPanchayat?.name },
        ],
        existing: villages.items,
        create: (name) => createVillage(gramPanchayat.id, name),
        reload: villages.reload,
      },
    };
    setAddConfig({ ...configs[level], level, initialName });
  };

  const errorFor = (level) => (showErrors ? errors[level] : '');

  return (
    <StepCard
      step={1}
      title="Project Location"
      description="Select the location from district down to village. Each list only shows places that belong to the selection above it."
    >
      {districtLocked && (
        <div className="mb-5">
          <Notice tone="info">
            The district is locked because Project ID <strong>{state.projectId.projectId}</strong> {existingProject ? 'was issued' : 'has been generated'} for it. Block, Gram Panchayat and Village can still be changed.
          </Notice>
        </div>
      )}

      <div className="grid grid-cols-1 gap-x-6 gap-y-5 md:grid-cols-2">
        <Field id="loc-district" label="District" required error={errorFor('district') || (!districts.loading && districts.error) || ''}>
          <div className="relative">
            <SearchableSelect
              id="loc-district"
              noun="district"
              value={district}
              options={districts.items}
              onChange={(value) => setLevel('district', value)}
              placeholder="Select district"
              searchPlaceholder="Search district…"
              loading={districts.loading}
              error={districts.error}
              onRetry={districts.reload}
              disabled={districtLocked}
              clearable={!districtLocked}
              invalid={Boolean(errorFor('district'))}
              aria-describedby={errorFor('district') ? 'loc-district-error' : undefined}
            />
            {districtLocked && <Lock className="pointer-events-none absolute right-9 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" aria-hidden="true" />}
          </div>
        </Field>

        <Field id="loc-block" label="Block" required error={errorFor('block')}>
          <SearchableSelect
            id="loc-block"
            noun="block"
            value={block}
            options={blocks.items}
            onChange={(value) => setLevel('block', value)}
            placeholder="Select block"
            searchPlaceholder="Search block…"
            loading={blocks.loading}
            error={blocks.error}
            onRetry={blocks.reload}
            disabled={!district}
            disabledReason="Select a district first"
            invalid={Boolean(errorFor('block'))}
            onCreate={(name) => openAdd('block', name)}
            aria-describedby={errorFor('block') ? 'loc-block-error' : undefined}
          />
        </Field>

        <Field id="loc-gp" label="Gram Panchayat" required error={errorFor('gramPanchayat')}>
          <SearchableSelect
            id="loc-gp"
            noun="Gram Panchayat"
            value={gramPanchayat}
            options={gramPanchayats.items}
            onChange={(value) => setLevel('gramPanchayat', value)}
            placeholder="Select Gram Panchayat"
            searchPlaceholder="Search Gram Panchayat…"
            loading={gramPanchayats.loading}
            error={gramPanchayats.error}
            onRetry={gramPanchayats.reload}
            disabled={!block}
            disabledReason="Select a block first"
            invalid={Boolean(errorFor('gramPanchayat'))}
            onCreate={(name) => openAdd('gramPanchayat', name)}
            aria-describedby={errorFor('gramPanchayat') ? 'loc-gp-error' : undefined}
          />
        </Field>

        <Field id="loc-village" label="Village Name" required error={errorFor('village')}>
          <SearchableSelect
            id="loc-village"
            noun="village"
            value={village}
            options={villages.items}
            onChange={(value) => setLevel('village', value)}
            placeholder="Select village"
            searchPlaceholder="Search village…"
            loading={villages.loading}
            error={villages.error}
            onRetry={villages.reload}
            disabled={!gramPanchayat}
            disabledReason="Select a Gram Panchayat first"
            invalid={Boolean(errorFor('village'))}
            onCreate={(name) => openAdd('village', name)}
            aria-describedby={errorFor('village') ? 'loc-village-error' : undefined}
          />
        </Field>
      </div>

      <AddMasterDialog
        config={addConfig}
        onClose={() => setAddConfig(null)}
        onCreated={(record) => {
          addConfig.reload();
          setLevel(addConfig.level, record);
        }}
      />
    </StepCard>
  );
}
