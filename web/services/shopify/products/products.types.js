/**
 * @typedef {Object} ShopifyProductsQuery
 * @property {{
 *   edges: {
 *     cursor: string,
 *     node: {
 *       id: string,
 *       title: string,
 *       handle: string,
 *       vendor: string,
 *       status: string,
 *       featuredImage?: { url: string } | null
 *     }
 *   }[],
 *   pageInfo: {
 *     hasNextPage: boolean,
 *     hasPreviousPage: boolean
 *   }
 * }} products
 */

/**
 * @typedef {Object} Product
 * @property {string} id
 * @property {string} title
 * @property {string} handle
 * @property {string} vendor
 * @property {string} status
 * @property {string=} image
 */

/**
 * @typedef {Object} ProductsResult
 * @property {Product[]} products
 * @property {{ hasNextPage: boolean, hasPreviousPage: boolean }} pageInfo
 * @property {string|null} cursor
 */

export {};
