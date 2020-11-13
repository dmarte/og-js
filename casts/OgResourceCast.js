import _ from "lodash";
/**
 * Cast class base for resources.
 * @author Delvi Marte <dmarte@famartech.com>
 */
export default class OgResourceCast {
  /**
   * @param {OgApi} api
   * @param {*} value
   */
  constructor(api, value) {
    this.$value = value;
  }

  set settings(config) {}

  get settings() {}

  get value() {
    return this.$value;
  }

  set value(value) {
    this.$value = value;
  }

  toJSON() {
    if (this.IS_STRING) {
      return this.toString();
    }
    return JSON.parse(JSON.stringify(this.$value));
  }

  toString() {
    return this.$value;
  }

  get IS_OBJECT() {
    return _.isObject(this.$value);
  }

  get IS_STRING() {
    return _.isString(this.$value);
  }

  get IS_INTEGER() {
    return _.isInteger(this.$value);
  }

  get IS_DECIMAL() {
    return _.isNumber(this.$value) && this.$value % 1 !== 0;
  }

  static get TYPE_STRING() {
    return "string";
  }

  static get TYPE_INTEGER() {
    return "integer";
  }

  static get TYPE_DECIMAL() {
    return "decimal";
  }

  static get TYPE_BOOLEAN() {
    return "boolean";
  }

  static get TYPE_OBJECT() {
    return "object";
  }

  static get TYPE_ARRAY() {
    return "array";
  }

  static get TYPE_ID() {
    return "id";
  }
}
