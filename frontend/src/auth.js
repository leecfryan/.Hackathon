// Auth type definitions for JSDoc comments

/**
 * @typedef {Object} User
 * @property {number} id
 * @property {string} email
 * @property {string} firstName
 * @property {string} lastName
 * @property {string} createdAt
 */

/**
 * @typedef {Object} LoginCredentials
 * @property {string} email
 * @property {string} password
 */

/**
 * @typedef {Object} RegisterCredentials
 * @property {string} firstName
 * @property {string} lastName
 * @property {string} email
 * @property {string} password
 * @property {string} confirmPassword
 */

/**
 * @typedef {Object} AuthResponse
 * @property {boolean} success
 * @property {string} message
 * @property {User} [user]
 * @property {string} [token]
 */

export {};
