import { EmployeeService } from '../../src/services/EmployeeService';

jest.mock('@infra/supabase/connect', () => {
  const supabaseMock = {
    from: jest.fn(() => supabaseMock),
    select: jest.fn(() => supabaseMock),
    eq: jest.fn(() => supabaseMock),
    single: jest.fn()
  };
  return { supabase: supabaseMock };
});

describe('EmployeeService.getById', () => {
  const service = new EmployeeService();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return an employee when found', async () => {
    const mockEmployee = {
      id: '123',
      name: 'John Doe',
      position: 'Developer',
      created_at: '2025-08-01T12:00:00Z',
      user: {
        id: '456',
        email: 'john@example.com',
        display_name: 'John'
      }
    };

    (supabase.single as jest.Mock).mockResolvedValueOnce({
      data: mockEmployee,
      error: null
    });

    const result = await service.getById('123');
    expect(result).toEqual(mockEmployee);
  });

  it('should return null when no employee is found', async () => {
    (supabase.single as jest.Mock).mockResolvedValueOnce({
      data: null,
      error: { code: 'PGRST116', message: 'No rows returned' }
    });

    const result = await service.getById('nonexistent-id');
    expect(result).toBeNull();
  });

  it('should throw an error when there is a real error', async () => {
    (supabase.single as jest.Mock).mockResolvedValueOnce({
      data: null,
      error: { code: 'PGRST123', message: 'Unexpected error' }
    });

    await expect(service.getById('error-id')).rejects.toThrow('Failed to get employee by ID: Unexpected error');
  });
});
