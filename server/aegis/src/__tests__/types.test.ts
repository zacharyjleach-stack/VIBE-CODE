import { describe, it, expect } from 'vitest';
import { AgentStatus, MissionStatus, TaskSchema } from '../types/index.js';

describe('AgentStatus', () => {
  it('has all expected lifecycle states', () => {
    expect(AgentStatus.IDLE).toBe('idle');
    expect(AgentStatus.INITIALIZING).toBe('initializing');
    expect(AgentStatus.CODING).toBe('coding');
    expect(AgentStatus.TESTING).toBe('testing');
    expect(AgentStatus.COMPLETE).toBe('complete');
    expect(AgentStatus.ERROR).toBe('error');
    expect(AgentStatus.TERMINATED).toBe('terminated');
  });
});

describe('MissionStatus', () => {
  it('has all expected mission states', () => {
    expect(MissionStatus.PENDING).toBe('pending');
    expect(MissionStatus.IN_PROGRESS).toBe('in_progress');
    expect(MissionStatus.COMPLETED).toBe('completed');
    expect(MissionStatus.FAILED).toBe('failed');
  });
});

describe('TaskSchema', () => {
  it('validates a valid task', () => {
    const result = TaskSchema.safeParse({
      id: '123e4567-e89b-12d3-a456-426614174000',
      title: 'Build auth module',
      description: 'Implement JWT authentication',
      priority: 'high',
    });
    expect(result.success).toBe(true);
  });

  it('rejects a task with invalid priority', () => {
    const result = TaskSchema.safeParse({
      id: '123e4567-e89b-12d3-a456-426614174000',
      title: 'Build auth module',
      description: 'Implement JWT authentication',
      priority: 'ultra', // invalid
    });
    expect(result.success).toBe(false);
  });

  it('applies default values', () => {
    const result = TaskSchema.safeParse({
      id: '123e4567-e89b-12d3-a456-426614174000',
      title: 'Build auth module',
      description: 'Implement JWT authentication',
      priority: 'medium',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.dependencies).toEqual([]);
      expect(result.data.status).toBe('pending');
      expect(result.data.tags).toEqual([]);
    }
  });
});
