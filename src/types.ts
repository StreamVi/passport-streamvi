import { StrategyOptions } from 'passport-oauth2';

/**
 * Опции для стратегии StreamVi
 */
export interface StreamViStrategyOptions extends StrategyOptions {
  /**
   * ID проекта в StreamVi
   */
  projectID?: string;

  /**
   * ID клиента
   */
  clientID: string;

  /**
   * Секретный ключ клиента
   */
  clientSecret: string;

  /**
   * URL для обратного вызова после авторизации
   */
  callbackURL: string;

  /**
   * Включить PKCE (Proof Key for Code Exchange)
   */
  pkce?: boolean;

  /**
   * Включить state (рекомендуется для PKCE)
   */
  state?: boolean;
}

/**
 * Ответ от StreamVi API при получении токена
 */
export interface StreamViTokenResponse {
  /**
   * Токен доступа
   */
  access_token: string;

  /**
   * Тип токена
   */
  token_type: string;

  /**
   * Время жизни токена в секундах
   */
  expires_in: number;

  /**
   * Области доступа
   */
  scope: string;
  
  /**
   * ID проекта
   */
  project_id: string;

  /**
   * Внешний ID проекта
   */
  project_external_id: string;
}

/**
 * Профиль пользователя
 */
export interface StreamViProfile {
  id: string;
  username: string;
  displayName: string;
  emails?: Array<{ value: string; type?: string }>;
  photos?: Array<{ value: string; type?: string }>;
}

/**
 * Пользовательский объект, который будет доступен после успешной аутентификации
 */
export interface StreamViUser {
  /**
   * Токен доступа
   */
  accessToken: string;

  /**
   * Токен обновления
   */
  refreshToken?: string;

  /**
   * Профиль пользователя
   */
  profile?: StreamViProfile;

  /**
   * ID проекта
   */
  projectId?: string;

  /**
   * Символьный ID проекта
   */
  projectExternalId: string,
}
