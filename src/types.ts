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
}

/**
 * Параметры запроса при аутентификации
 */
export interface StreamViAuthRequest {
  /**
   * Код авторизации
   */
  code?: string;

  /**
   * ID группы проекта
   */
  group_id?: string;
}
