export const supabaseMock = {
  from: jest.fn(() => supabaseMock),
  select: jest.fn(() => supabaseMock),
  eq: jest.fn(() => supabaseMock),
  single: jest.fn()
};
