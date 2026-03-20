export type AgentStatus = 'in-progress' | 'pending' | 'idle';

export type Agent = {
  id: string;
  role: string;
  model: string;
  modelTier: 'foundation' | 'high-reasoning' | 'balanced' | 'fast' | string;
  autoApprove: boolean;
  isSignalHub?: boolean;
  inheritable?: boolean;
  humanAccessible?: boolean;
  isPrimaryDirector?: boolean;
  capabilities: string[];
  matchCategories: string[];
  matchKeywords: string[];
  lastActive?: string | null;
  lastTask?: string | null;
  // Live status — derived at load time from agent-context.json + activity files
  status?: AgentStatus;
  currentTask?: string | null;
  currentJoinId?: string | null;
};

export type AgentActivitySignal = {
  type: 'checkpoint' | 'handoff' | 'complete' | 'note';
  message: string;
  ts: string;
};

export type AgentActivity = {
  agentId: string;
  status: AgentStatus;
  currentTask?: string | null;
  currentJoinId?: string | null;
  updatedAt: string;
  signals?: AgentActivitySignal[];
};

export type MemoryNode = {
  name: string;
  type: 'file' | 'dir';
  path: string;
  ext?: string;
  children?: MemoryNode[];
};

export type JoinPattern = {
  id: string;
  title: string;
  file: string;
  agentLine: string;
  content: string;
};

export type Platform = {
  id: string;
  name: string;
  files: string[];
  adapterFile: string | null;
  description: string;
};

const get = (url: string) => fetch(url).then((r) => r.json());

export const api = {
  agents:        () => get('/api/agents'),
  agentActivity: () => get('/api/agent-activity'),
  context:       () => get('/api/context'),
  timeline:      () => get('/api/timeline'),
  memory:        () => get('/api/memory'),
  memoryFile:    (slug: string) => get(`/api/memory/${slug}`),
  joins:         () => get('/api/joins'),
  platforms:     () => get('/api/platforms'),
  rnaConfig:     () => get('/api/rna-config'),
};
