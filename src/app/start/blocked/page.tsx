'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { fireFmEvent, buildEvent } from '@/lib/fm/events';
import { buildCaseTranscript } from '@/lib/fm/case-state';
import { getStoredCaseState, setResumeDraft } from '@/lib/fm/clientSession';

export default function BlockedPage() {
  const router = useRouter();

  useEffect(() => {
    const { name, payload } = buildEvent('fm_blocked_view', 'blocked');
    fireFmEvent(name, payload);
  }, []);

  function handleAddMoreNotes() {
    const caseState = getStoredCaseState();
    if (caseState) {
      setResumeDraft(buildCaseTranscript(caseState));
    }
    router.push('/start');
  }

  return (
    <main
      style={{
        minHeight: '100svh',
        backgroundColor: 'var(--color-surface)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: 'var(--spacing-page)',
      }}
    >
      <div style={{ maxWidth: '36rem', margin: '0 auto', width: '100%' }}>
        {/* §6: Graceful blocked state — never show "Blocked" or error codes */}
        <h1 className="text-title" style={{ marginBottom: '1rem' }}>
          We need a little more to work with
        </h1>

        <p
          className="text-body"
          style={{ color: 'var(--color-muted)', marginBottom: '2rem' }}
        >
          What you shared gives us a starting point, but the fastest way to move
          forward is to answer one focused question — or add one concrete detail.
        </p>

        <p className="text-small" style={{ color: 'var(--color-muted)', marginTop: '-1.2rem', marginBottom: '1.6rem' }}>
          You did not do anything wrong. We are holding quality so your direction is specific and usable.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxWidth: '20rem' }}>
          <button
            onClick={handleAddMoreNotes}
            style={{
              padding: '0.875rem 1.5rem',
              backgroundColor: 'var(--color-text)',
              color: 'var(--color-surface)',
              border: 'none',
              borderRadius: 'var(--radius-input)',
              fontSize: '1rem',
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            Add one concrete detail
          </button>

          <button
            onClick={() => router.push('/start/question')}
            style={{
              padding: '0.875rem 1.5rem',
              backgroundColor: 'var(--color-surface)',
              color: 'var(--color-text)',
              border: '1.5px solid var(--color-border)',
              borderRadius: 'var(--radius-input)',
              fontSize: '1rem',
              fontWeight: 500,
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            Answer one focused question
          </button>
        </div>
      </div>
    </main>
  );
}
