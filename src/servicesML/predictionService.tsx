import axios from 'axios';

const API_BASE = '/api/ml';

const mlClient = axios.create({
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Remove JWT headers
mlClient.interceptors.request.use((config) => {
  console.log('ML Request:', config.method?.toUpperCase(), config.url);

  // Remove auth headers
  if (config.headers) {
    delete config.headers.Authorization;
    delete config.headers.authorization;
  }

  return config;
});

mlClient.interceptors.response.use(
  (response) => {
    console.log('ML Response:', response.status, response.data);
    return response;
  },
  (error) => {
    console.error('ML Error:', error.response?.status, error.response?.data);
    return Promise.reject(error);
  },
);

export type PredictRequest = {
  district: string;
  province: string;
  area: number;
  frontage: number;
  access_road: number;
  direction: string;
  property_type: string;
  floors: number;
  bedrooms: number;
  bathrooms: number;
};

export type PredictResponse = {
  success: boolean
  data: number
  confidence: any
  details: any
  message: string
  timestamp: string
  model_version: string
};

export async function predictPrice(body: PredictRequest): Promise<PredictResponse> {
  try {
    const response = await mlClient.post(`${API_BASE}/predict`, body);
    return response.data;
  } catch (err: any) {
    console.error(err);
    throw err;
  }
}
