import { useSyncExternalStore } from 'react';
import { getOpenAIKey, subscribeOpenAIKey } from '../lib/openaiKey.js';

export const useOpenAIKey = () => useSyncExternalStore(subscribeOpenAIKey, getOpenAIKey, () => '');
