import axios from 'axios';
import apiService, { ErrorResponse } from '../../services/api';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('api error normalization', () => {
  beforeEach(() => {
    mockedAxios.create.mockReturnValue(mockedAxios as any);
  });

  it('maps standardized error object to userMessage', async () => {
    const err = {
      response: {
        status: 503,
        data: {
          code: 'DEPENDENCY_UNAVAILABLE',
          httpStatus: 503,
          message: '外部依赖不可用',
          retryable: true,
        } as ErrorResponse,
        config: { url: '/api/analyze' },
      },
    } as any;
    mockedAxios.post.mockRejectedValueOnce(err);

    await expect(
      apiService.analyzeUserBackground({
        undergraduate_university: 'U',
        undergraduate_major: 'M',
        gpa: 3.0,
        gpa_scale: '4.0',
        graduation_year: 2024,
        target_countries: ['US'],
        target_majors: ['CS'],
        target_degree_type: 'Master',
      } as any)
    ).rejects.toMatchObject({ userMessage: '外部依赖不可用' });
  });
});

















