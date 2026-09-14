/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { SyncStatus } from '../types';
import { subscribeSyncStatus, flushSyncQueue, getPendingCount } from '../lib/syncEngine';

export function useSyncStatus() {
  const [status, setStatus] = useState<SyncStatus>('idle');
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string | undefined>();

  useEffect(() => {
    const unsubscribe = subscribeSyncStatus((newStatus, count, error) => {
      setStatus(newStatus);
      setPendingCount(count);
      setErrorMessage(error);
    });

    getPendingCount().then(setPendingCount);

    return () => {
      unsubscribe();
    };
  }, []);

  const triggerSync = async () => {
    return flushSyncQueue();
  };

  return {
    status,
    pendingCount,
    errorMessage,
    triggerSync,
  };
}
