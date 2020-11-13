import { set, get, isObject, isFunction } from "lodash";
import OgResourceCast from "../casts/OgResourceCast";
import OgQueryBuilder from "./OgQueryBuilder";
import OgApiResponse from "./OgApiResponse";
import OgCollection from "./OgCollection";

const getCastValue = (api, key, casts = {}, value = null, settings) => {
  if (!casts[key]) {
    return value;
  }

  const Type = casts[key];

  if (
    isFunction(Type) &&
    Object.prototype.isPrototypeOf.call(OgResourceCast, Type)
  ) {
    const t = new Type(api.config, value);
    // Let the casts types get the same settings
    // the previous one had.
    if (settings) {
      t.settings = settings;
    }
    return t;
  }

  if (
    isFunction(Type) &&
    Object.prototype.isPrototypeOf.call(OgResource, Type)
  ) {
    return new Type(api, value);
  }

  if (
    isFunction(Type) &&
    Object.prototype.isPrototypeOf.call(OgCollection, Type)
  ) {
    return new Type(api).setItems(!Array.isArray(value) ? [] : value);
  }

  let output;

  switch (Type) {
    case "boolean":
      output = value ? Boolean(value) : false;
      break;
    case "string":
      output = value ? String(value) : "";
      break;
    case "integer":
      output = parseInt(value, 10) || 0;
      break;
    case "decimal":
      output = parseFloat(value) || 0.0;
      break;
    case "id":
      output = parseInt(value, 10) || null;
      break;
    default:
      output = value;
      break;
  }

  return output;
};

/**
 * Base class to interact with an entity
 * on the API.
 * @author Delvi Marte <dmarte@famartech.com>
 */
export default class OgResource extends OgQueryBuilder {
  /**
   * @param {OgApi} api
   * @param {Object} attributes
   * @param {String} path String path used to fetch to the API.
   */
  constructor(api, attributes = {}, path = "/") {
    super();
    this.$api = api;
    this.$response = new OgApiResponse();
    this.$primaryKey = "id";
    this.$fillable = [];
    this.$casts = {};
    this.$attributes = {};
    this.$status = {
      updating: false,
      fetching: false,
      creating: false,
      deleting: false
    };
    this.$path = path || "/";
    this.fill(attributes);
  }

  /**
   * @param {OgResource} resource
   * @returns {OgResource}
   */
  merge(resource) {
    this.fill(resource.toJSON());
    return this;
  }

  clone(Resource) {
    if (Resource instanceof OgResource) {
      return new Resource.constructor(this.$api, this.toJSON());
    }
    return new Resource(this.$api, this.toJSON());
  }

  async findOrFail(id) {
    if (!id) {
      throw new Error("The ID parameter is required to find or fail.");
    }

    this.resetStatus();

    this.$response.clear();

    this.$status.fetching = true;

    const url = [this.$path, id].join("/");

    this.$response = await this.$api.get(url, this.toString());

    if (this.$response.failed) {
      this.$status.fetching = false;

      throw new Error(this.$response.message);
    }
    this.resetStatus();
    this.fill(this.$response.data);
    return this;
  }

  async create() {
    this.$api.contentTypeJson();
    this.resetStatus();
    this.$response.clear();
    this.$status.creating = true;
    this.$response = await this.$api.post(
      this.getQueryString(this.$path),
      this.toJSON()
    );
    if (this.$response.failed) {
      this.resetStatus();
      throw new Error(this.$response.message);
    }
    this.fill(this.$response.data);
    this.$status.creating = false;
    return this;
  }

  async update() {
    this.$api.contentTypeJson();
    this.resetStatus();
    this.$response.clear();
    this.$status.updating = true;
    const url = [this.$path, this.primaryKeyValue].join("/");
    this.$response = await this.$api.post(this.getQueryString(url), {
      ...this.toJSON(),
      _method: "PUT"
    });
    if (this.$response.failed) {
      this.resetStatus();
      throw new Error(this.$response.message);
    }
    this.fill(this.$response.data);
    this.resetStatus();
    return this;
  }

  /**
   * This method allow to delete a given resource.
   * @returns {Promise<OgResource>}
   */
  async delete() {
    if (!this.primaryKeyValue) {
      throw new Error(
        this.$config.locale.trans("No resource selected to delete.")
      );
    }
    this.$api.contentTypeJson();
    this.resetStatus();
    this.$response.clear();
    this.$status.deleting = true;
    const url = [this.$path, this.primaryKeyValue].join("/");
    this.$response = await this.$api.post(this.getQueryString(url), {
      ...this.toJSON(),
      _method: "DELETE"
    });
    if (this.$response.failed) {
      this.resetStatus();
      throw new Error(this.$response.message);
    }
    this.resetStatus();
    return this;
  }

  save() {
    if (this.primaryKeyValue) {
      return this.update();
    }

    return this.create();
  }

  fail(path) {
    return this.$response.fail(path);
  }

  state(path) {
    return this.$response.state(path);
  }

  feedback(path) {
    return this.$response.feedback(path);
  }

  resetStatus() {
    this.$status.creating = false;
    this.$status.updating = false;
    this.$status.deleting = false;
    this.$status.fetching = false;
    return this;
  }

  reset() {
    this.$response.clear();
    this.$attributes = this.SCHEMA;
  }

  abort() {
    this.$api.abort();
    this.resetStatus();
  }

  /**
   * Used to define a set of attributes
   * to be casted.
   *
   * @param {Object} casts
   * @returns {OgResource}
   */
  define(casts = {}) {
    Object.keys(casts).forEach(path => {
      this.cast(path, casts[path]);
    });
    this.$attributes = this.SCHEMA;
    return this;
  }

  /**
   * Set an attribute to be casted to given type.
   *
   * NOTE: When you cast a vaiue, this means tha
   * value should be fillable by the resource.
   * The SDK will automatically set the pat as fillable.
   *
   * @param {String} path
   * @param {*} type
   * @returns {OgResource}
   */
  cast(path, type) {
    this.$casts[path] = type;
    this.fillable(path);
    return this;
  }

  /**
   * Define a path of a given resource
   * as fillable.
   *
   * @param {String} path
   * @returns {OgResource}
   */
  fillable(path) {
    this.$fillable.push(path);
    return this;
  }

  /**
   * Fill a set of attributes.
   *
   * @param {Object} attributes
   * @returns {OgResource}
   */
  fill(attributes) {
    if (!attributes) {
      return this;
    }
    this.$fillable.forEach(path => {
      const value = get(attributes, path, null);
      if (!value && this.filled(path)) {
        return;
      }
      this.set(path, value);
    });
    return this;
  }

  set(path, value) {
    if (!this.$fillable.includes(path)) {
      return this;
    }

    const current = get(this.$attributes, path) || {};

    set(
      this.$attributes,
      path,
      getCastValue(this.$api, path, this.$casts, value, current.settings)
    );
    return this;
  }

  get(path, defaultValue = null) {
    return get(this.$attributes, path, defaultValue);
  }

  /**
   * Determine whether or not a given path
   * has a value.
   *
   * NOTE:
   * A path with a value NULL is considered
   * not filled.
   *
   * @param {String} path
   * @returns {boolean}
   */
  filled(path) {
    return get(this.$attributes, path, null) !== null;
  }

  toJSON() {
    const out = {};
    Object.keys(this.$casts).forEach(path => {
      let value = this.get(path);
      if (value instanceof OgResourceCast || value instanceof OgResource) {
        value = value.toJSON();
      }
      if (value instanceof OgCollection) {
        value = value.toJsonItems();
      }
      set(out, path, value);
    });
    return out;
  }

  get primaryKeyValue() {
    return this.get(this.$primaryKey);
  }

  get FAILED_BY_SESSION_EXPIRE() {
    return this.$response.FAILED_BY_SESSION_EXPIRE;
  }

  get FAILED_MESSAGE() {
    return this.$response.message;
  }

  get FAILED_CODE() {
    return this.$response.status;
  }

  get FAILED() {
    return this.$response.failed;
  }

  get IS_SAVING() {
    return this.IS_CREATING || this.IS_UPDATING || this.IS_DELETING || false;
  }

  get IS_CREATING() {
    return this.$status.creating;
  }

  get IS_UPDATING() {
    return this.$status.updating;
  }

  get IS_FETCHING() {
    return this.$status.fetching;
  }

  get IS_DELETING() {
    return this.$status.deleting;
  }

  get ATTRIBUTES() {
    return this.$attributes;
  }

  get SCHEMA() {
    const schema = {};
    Object.keys(this.$casts).forEach(path => {
      set(schema, path, getCastValue(this.$api, path, this.$casts, null));
      const value = get(schema, path);
      if (isObject(value) && value instanceof OgResource) {
        set(schema, path, value.SCHEMA);
      }
    });
    return schema;
  }
}
