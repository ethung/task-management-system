import { createTaskSchema, updateTaskSchema } from '@/lib/tasks/task-validation';

describe('createTaskSchema', () => {
  it('should validate a correct task', () => {
    const task = {
      title: 'My new task',
      description: 'This is a description',
      priority: 1,
    };
    const result = createTaskSchema.safeParse(task);
    expect(result.success).toBe(true);
  });

  it('should invalidate a task with a short title', () => {
    const task = {
      title: 'My',
    };
    const result = createTaskSchema.safeParse(task);
    expect(result.success).toBe(false);
  });

  it('should handle default priority', () => {
    const task = {
      title: 'My new task',
    };
    const result = createTaskSchema.safeParse(task);
    if (result.success) {
      expect(result.data.priority).toBe(3);
    } else {
      fail('Schema should be valid');
    }
  });
});

describe('updateTaskSchema', () => {
  it('should validate a correct task update', () => {
    const task = {
      title: 'My updated task',
      status: 'COMPLETED',
    };
    const result = updateTaskSchema.safeParse(task);
    expect(result.success).toBe(true);
  });

  it('should invalidate a task update with a short title', () => {
    const task = {
      title: 'My',
    };
    const result = updateTaskSchema.safeParse(task);
    expect(result.success).toBe(false);
  });

  it('should allow partial updates', () => {
    const task = {
      priority: 5,
    };
    const result = updateTaskSchema.safeParse(task);
    expect(result.success).toBe(true);
  });
});
