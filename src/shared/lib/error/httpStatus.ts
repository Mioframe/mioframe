/**
 * HTTP Status Code enum — стандартные коды ответов HTTP/1.1 (RFC 7231, RFC 9110).
 *
 * @module error.HttpStatus
 * @description
 * Этот модуль предоставляет типизированные константы для всех стандартных HTTP статус-кодов.
 * Используется в слоях обработки ошибок и адаптерах Google Drive API для корректной классификации ответов сервера.
 *
 * ## Категории статус-кодов
 * - **2xx (Success):** Успешное выполнение запроса. Исключены кэш-связанные коды (204, 206).
 * - **3xx (Redirection):** Перенаправления — исключены по требованиям проекта.
 * - **4xx (Client Errors):** Ошибки клиента — некорректный запрос или ресурс недоступен.
 * - **5xx (Server Errors):** Ошибки сервера — внутренняя проблема сервиса.
 *
 * ## Использование
 * ```typescript
 * import { HttpStatusCode, HttpError } from '@/shared/lib/error';
 *
 * try {
 *   const response = await api.getUser(id);
 *   if (response.status === HttpStatusCode.UNAUTHORIZED) {
 *     // Перенаправить на страницу логина
 *   }
 * } catch (error) {
 *   if (error instanceof HttpError && error.statusCode === HttpStatusCode.NOT_FOUND) {
 *     console.log('Пользователь не найден');
 *   }
 * }
 * ```
 *
 * ## Примечания
 * - Все значения соответствуют официальным спецификациям IETF.
 * - Для кастомных статус-кодов используйте отдельный enum (например, `CustomStatusCode`).
 */

export enum HttpStatusCode {
  // Success (2xx) — успешное выполнение запроса
  /** Успешный ответ с данными */
  OK = 200,
  /** Ресурс успешно создан */
  CREATED = 201,
  /** Запрос принят для обработки (асинхронно) */
  ACCEPTED = 202,
  /** Ответ содержит информацию от другого источника */
  NON_AUTHORITATIVE_INFORMATION = 203,

  // Redirection (3xx) — перенаправления (исключены по требованиям проекта)

  // Client Errors (4xx) — ошибки клиента
  /** Неверный синтаксис запроса */
  BAD_REQUEST = 400,
  /** Требуется авторизация */
  UNAUTHORIZED = 401,
  /** Оплата требуется (редко используется в веб-приложениях) */
  PAYMENT_REQUIRED = 402,
  /** Доступ запрещён (аутентифицирован, но нет прав) */
  FORBIDDEN = 403,
  /** Ресурс не найден */
  NOT_FOUND = 404,
  /** Метод запроса не поддерживается для этого ресурса */
  METHOD_NOT_ALLOWED = 405,
  /** Представление (Content-Type) не принимается сервером */
  NOT_ACCEPTABLE = 406,
  /** Требуется прокси-аутентификация */
  PROXY_AUTHENTICATION_REQUIRED = 407,
  /** Запрос истёк по времени */
  REQUEST_TIMEOUT = 408,
  /** Конфликт ресурсов (например, оптимистичная блокировка) */
  CONFLICT = 409,
  /** Ресурс был удалён */
  GONE = 410,
  /** Требуется длина тела запроса в заголовке Content-Length */
  LENGTH_REQUIRED = 411,
  /** Неудачная проверка условия (If-Match, If-None-Match и т.д.) */
  PRECONDITION_FAILED = 412,
  /** Тело запроса превышает лимит размера */
  PAYLOAD_TOO_LARGE = 413,
  /** URI запроса слишком длинный */
  URI_TOO_LONG = 414,
  /** Тип содержимого не поддерживается сервером */
  UNSUPPORTED_MEDIA_TYPE = 415,
  /** Диапазон запроса недопустим (Range header) */
  RANGE_NOT_SATISFIABLE = 416,
  /** Ожидание выполнения предыдущего запроса перед обработкой этого */
  EXPECTATION_FAILED = 417,
  /** Шутка: сервер — чайник и не может вскипеть (RFC 2324) */
  IM_A_TEAPOT = 418,
  /** Запрос отправлен на неверный хост */
  MISDIRECTED_REQUEST = 421,
  /** Сущность запроса невалидна (например, валидация JSON Schema) */
  UNPROCESSABLE_ENTITY = 422,
  /** Ресурс заблокирован (оптимистичная блокировка) */
  LOCKED = 423,
  /** Зависимый запрос не выполнен успешно */
  FAILED_DEPENDENCY = 424,
  /** Требуется более свежая версия ресурса для обработки */
  TOO_EARLY = 425,
  /** Требуется обновление протокола (Upgrade header) */
  UPGRADE_REQUIRED = 426,
  /** Требуется заголовок Precondition */
  PRECONDITION_REQUIRED = 428,
  /** Слишком много запросов (rate limiting) */
  TOO_MANY_REQUESTS = 429,
  /** Заголовки запроса слишком большие */
  REQUEST_HEADER_FIELDS_TOO_LARGE = 431,
  /** Ресурс недоступен по юридическим причинам */
  UNAVAILABLE_FOR_LEGAL_REASONS = 451,

  // Server Errors (5xx) — ошибки сервера
  /** Внутренняя ошибка сервера */
  INTERNAL_SERVER_ERROR = 500,
  /** Функциональность не реализована */
  NOT_IMPLEMENTED = 501,
  /** Ошибка шлюза (некорректный ответ от upstream-сервера) */
  BAD_GATEWAY = 502,
  /** Сервис временно недоступен для обслуживания */
  SERVICE_UNAVAILABLE = 503,
  /** Тайм-аут соединения с upstream-сервером */
  GATEWAY_TIMEOUT = 504,
  /** Версия HTTP протокола не поддерживается */
  HTTP_VERSION_NOT_SUPPORTED = 505,
  /** Несколько вариантов ресурса предлагают разные условия (negotiation loop) */
  VARIANT_ALSO_NEGOTIATES = 506,
  /** Недостаточно хранилища для выполнения запроса */
  INSUFFICIENT_STORAGE = 507,
  /** Обнаружен цикл перенаправлений */
  LOOP_DETECTED = 508,
  /** Расширение HTTP не поддерживается (RFC 2774) */
  NOT_EXTENDED = 510,
  /** Требуется сетевая аутентификация для доступа к ресурсу */
  NETWORK_AUTHENTICATION_REQUIRED = 511,
}
