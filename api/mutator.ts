import type {
  AxiosError,
  AxiosRequestConfig,
  AxiosResponse,
} from "axios";

import { apiClient } from "./client";

export const customInstance = async <T>(
  config: AxiosRequestConfig,
): Promise<T> => {
  const response: AxiosResponse<T> = await apiClient.request(config);

  return response.data;
};

export type ErrorType<T> = AxiosError<T>;

export type BodyType<T> = T;