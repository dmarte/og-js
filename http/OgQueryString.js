import { set } from "lodash";

export default class OgQueryString {
  constructor() {
    this.$query = new URLSearchParams();
  }

  /**
   * Verify if a given path exists in the query string.
   *
   * @param {String} path
   * @returns {boolean}
   */
  has(path) {
    return this.$query.has(OgQueryString.toQuery(path));
  }

  /**
   * Remove a given path from current query string.
   *
   * @param {String} path
   * @returns {OgQueryString}
   */
  remove(path) {
    if (this.has(path)) {
      this.$query.delete(OgQueryString.toQuery(path));
    }
    return this;
  }

  /**
   * Set a given key into the query string path.
   *
   * @param {String|Object|undefined} path
   * @param {String|Number|Boolean} value
   * @param {Boolean} uniqueKey
   * @returns {OgQueryString}
   */
  where(path, value = undefined, uniqueKey = false) {
    if (!path) {
      return this;
    }
    if (path instanceof Object) {
      Object.keys(path).forEach(p => this.where(p, path[p]));
      return this;
    }

    if (this.has(path) && !uniqueKey) {
      this.$query.append(OgQueryString.toQuery(path), value);
      return this;
    }
    if (this.has(path)) {
      this.remove(path);
    }
    this.$query.set(OgQueryString.toQuery(path), value);
    return this;
  }

  reset() {
    this.$query = new URLSearchParams();
    return this;
  }

  toString() {
    return this.$query.toString();
  }

  toJSON() {
    const out = {};
    const output = {};
    for (const item of this.$query.entries()) {
      const i = item.shift();
      const key = OgQueryString.toDot(i);
      if (out[key]) {
        if (Array.isArray(out[key])) {
          out[key].push(item.pop());
          continue;
        }

        out[key] = [out[key]];
        out[key].push(item.pop());
        continue;
      }
      out[key] = item.pop();
    }
    Object.keys(out).forEach(path => {
      set(output, path, out[path]);
    });

    return output;
  }

  /**
   * Convert a dot notation string into
   * a query string format.
   *
   * contact.first.name to contact[first][name]
   *
   * @param {String} path
   * @returns {String}
   */
  static toQuery(path) {
    return path
      .split(".")
      .map((item, index) => {
        if (index < 1) {
          return item;
        }
        return `[${item}]`;
      })
      .join("");
  }

  /**
   * Convert this: contact[name][first]
   * To this: contact.name.first
   *
   * @param {String} queryString
   * @returns {String}
   */
  static toDot(queryString) {
    return queryString
      .split("[")
      .map(path => path.trim().replace(/\W/g, ""))
      .join(".");
  }
}
