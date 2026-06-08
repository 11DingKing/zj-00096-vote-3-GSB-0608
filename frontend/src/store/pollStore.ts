import { create } from 'zustand';
import { Poll, PollResults, Template } from '../types';
import { pollsApi, templatesApi } from '../services/api';

interface PollState {
  polls: Poll[];
  currentPoll: Poll | null;
  results: PollResults | null;
  templates: Template[];
  loading: boolean;
  hasVoted: boolean;
  fetchPolls: () => Promise<void>;
  fetchPoll: (id: number) => Promise<void>;
  fetchResults: (id: number) => Promise<void>;
  fetchTemplates: () => Promise<void>;
  checkHasVoted: (id: number) => Promise<void>;
  createPoll: (data: any) => Promise<any>;
  vote: (id: number, data: any) => Promise<any>;
  exportResults: (id: number, details?: boolean) => Promise<void>;
}

export const usePollStore = create<PollState>((set, get) => ({
  polls: [],
  currentPoll: null,
  results: null,
  templates: [],
  loading: false,
  hasVoted: false,

  fetchPolls: async () => {
    set({ loading: true });
    try {
      const response = await pollsApi.getAll();
      set({ polls: response.data, loading: false });
    } catch {
      set({ loading: false });
    }
  },

  fetchPoll: async (id: number) => {
    set({ loading: true });
    try {
      const response = await pollsApi.getById(id);
      set({ currentPoll: response.data, loading: false });
    } catch {
      set({ loading: false });
    }
  },

  fetchResults: async (id: number) => {
    try {
      const response = await pollsApi.getResults(id);
      set({ results: response.data });
    } catch {}
  },

  fetchTemplates: async () => {
    try {
      const response = await templatesApi.getAll();
      set({ templates: response.data });
    } catch {}
  },

  checkHasVoted: async (id: number) => {
    try {
      const browserFingerprint = Math.random().toString(36).substring(2);
      const response = await pollsApi.hasVoted(id, browserFingerprint);
      set({ hasVoted: response.data.hasVoted });
    } catch {}
  },

  createPoll: async (data: any) => {
    const response = await pollsApi.create(data);
    await get().fetchPolls();
    return response.data;
  },

  vote: async (id: number, data: any) => {
    const browserFingerprint = Math.random().toString(36).substring(2);
    const response = await pollsApi.vote(id, { ...data, browserFingerprint });
    await get().checkHasVoted(id);
    await get().fetchResults(id);
    return response.data;
  },

  exportResults: async (id: number, details?: boolean) => {
    const response = await pollsApi.export(id, details);
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `poll-${id}-results.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  },
}));
