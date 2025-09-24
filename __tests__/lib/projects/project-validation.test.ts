import { createProjectSchema, updateProjectSchema } from '@/lib/projects/project-validation';

describe('createProjectSchema', () => {
  it('should validate a correct project', () => {
    const project = {
      name: 'My new project',
      description: 'This is a description',
    };
    const result = createProjectSchema.safeParse(project);
    expect(result.success).toBe(true);
  });

  it('should invalidate a project with a short name', () => {
    const project = {
      name: 'My',
    };
    const result = createProjectSchema.safeParse(project);
    expect(result.success).toBe(false);
  });
});

describe('updateProjectSchema', () => {
  it('should validate a correct project update', () => {
    const project = {
      name: 'My updated project',
      status: 'archived',
    };
    const result = updateProjectSchema.safeParse(project);
    expect(result.success).toBe(true);
  });

  it('should invalidate a project update with a short name', () => {
    const project = {
      name: 'My',
    };
    const result = updateProjectSchema.safeParse(project);
    expect(result.success).toBe(false);
  });

  it('should allow partial updates', () => {
    const project = {
      description: 'new description',
    };
    const result = updateProjectSchema.safeParse(project);
    expect(result.success).toBe(true);
  });
});
