import { set, get, merge, isString } from 'lodash';
import OgCast from '../casts/OgCast';
import OgResourceCast from '../casts/OgResourceCast';
import OgQueryBuilder from './OgQueryBuilder';
import OgApiResponse from './OgApiResponse';
import OgCollection from './OgCollection';

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
    constructor(api, attributes = {}, path = '/') {
        super();
        this.$key = Math.random();
        this.$api = api;
        this.$response = new OgApiResponse();
        this.$primaryKey = 'id';
        this.$fillable = [];
        this.$casts = {};
        this.$attributes = {};
        this.$defaults = {};
        this.$path = path || '/';
        this.$status = {
            updating: false,
            fetching: false,
            creating: false,
            deleting: false,
        };

        this.fill(attributes);
    }

    static build(api, resource, attributes) {
        return new resource(api, attributes);
    }


    /**
     * Merge one resource with another resource.
     *
     * @param {OgResource} resource
     * @returns {OgResource}
     */
    merge(resource) {
        if (resource instanceof OgResource) {
            this.fill(resource.toJSON());
        }
        return this;
    }

    /**
     * Clone the current resource.
     *
     * @param {OgResource} resource
     * @returns {*}
     */
    clone(resource) {

        if (resource instanceof OgResource) {

            return new resource.constructor(this.$api, this.toJSON());

        }

        return new resource(this.$api, this.toJSON());
    }

    async duplicate(attributes) {

        const resource = this.clone(this);

        resource.set(this.$primaryKey, null);

        resource.fill(attributes);

        if (!await resource.save()) {

            throw new Error(resource.response.save);
        }

        return resource;
    }

    /**
     * Find a given resource in the server api or fail.
     *
     * @param {Number} id
     * @returns {Promise<OgResource>}
     */
    async findOrFail(id) {

        if (!id) {

            throw new Error('The ID parameter is required to find or fail.');

        }

        this.resetStatus();

        this.$response.reset();

        this.$status.fetching = true;

        const url = [this.$path, id].join('/');

        const query = new super.constructor();

        query.where(super.toJSON());

        this.$response = await this.$api.get(url, query);

        if (this.$response.failed) {
            this.$status.fetching = false;

            throw new Error(this.$response.message);
        }

        this.resetStatus();

        this.fill(this.$response.data);

        return this;
    }

    /**
     * Create a new resource.
     *
     * @property {Object} attributes
     * @returns {Promise<OgResource>}
     */
    async create(attributes) {

        this.fill(attributes);

        this.$api.contentTypeJson();

        this.resetStatus();

        this.$response.reset();

        this.$status.creating = true;

        try {

            this.$response = await this.$api.post(
                this.$path,
                this.toJSON(),
            );

        } catch (ex) {

            console.error(ex.message);

            this.resetStatus();

        }

        this.resetStatus();

        if (this.$response.failed) {

            throw new Error(this.$response.message);

        }

        this.fill(this.$response.data);

        return this;
    }

    /**
     * Update a given resource.
     * @returns {Promise<OgResource>}
     */
    async update() {

        this.$api.contentTypeJson();

        this.resetStatus();

        this.$response.reset();

        this.$status.updating = true;

        const url = [this.$path, this.primaryKeyValue].join('/');

        this.$response = await this.$api.post(url, {
            ...this.toJSON(),
            _method: 'PUT',
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
     *
     * @returns {Promise<OgResource>}
     */
    async delete() {

        if (!this.primaryKeyValue) {

            throw new Error('No resource selected to delete.');

        }

        this.$api.contentTypeJson();

        this.resetStatus();

        this.$response.reset();

        this.$status.deleting = true;

        const url = [this.$path, this.primaryKeyValue].join('/');

        this.$response = await this.$api.post(url, {
            ...this.toJSON(),
            _method: 'DELETE', // Compatibility with Laravel
        });

        if (this.$response.failed) {
            this.resetStatus();
            throw new Error(this.$response.message);
        }

        this.resetStatus();

        return this;
    }

    /**
     * Create or update the current resource.
     *
     * @returns {Boolean}
     */
    async save() {

        try {

            if (this.primaryKeyValue) {

                await this.update();

            } else {

                await this.create();

            }

            return true;

        } catch (ex) {

            console.error(ex.message);

            return false;
        }
    }

    /**
     * Check if the response has a given field in the failed response.
     *
     * @param {String|Array} path
     * @returns {boolean}
     */
    fail(path) {
        return this.$response.fail(path);
    }

    /**
     * If failed return TRUE
     * when not return NULL.
     *
     * @param {String} path
     * @returns {boolean|null}
     */
    state(path) {
        return this.$response.state(path);
    }

    /**
     * Get a the message for a given field path in the resource.
     *
     * @param {String} path
     * @returns {String}
     */
    feedback(path) {
        return this.$response.feedback(path);
    }

    /**
     * Reset the status of the current resource.
     *
     * @protected
     * @returns {OgResource}
     */
    resetStatus() {
        this.$status.creating = false;
        this.$status.updating = false;
        this.$status.deleting = false;
        this.$status.fetching = false;
        return this;
    }

    /**
     * Reset the status, data and response of the current resource.
     *
     * @returns {OgResource}
     */
    reset() {
        this.$response.reset();
        this.$attributes = this.schema(1);
        this.resetStatus();
        return this;
    }

    /**
     * Abort the request made by the given resource.
     *
     * @returns {OgResource}
     */
    abort() {
        this.$api.abort();
        this.resetStatus();
        return this;
    }

    /**
     * Used to define a set of attributes to be casted.
     *
     * @param {Object} casts
     * @param {Object} defaults
     * @returns {OgResource}
     */
    define(casts = {}, defaults = {}) {

        Object.keys(casts).forEach(path => {
            this.cast(path, casts[path]);
        });

        this.defaults(defaults);

        this.$attributes = this.schema(1);

        return this;
    }

    /**
     * Set default values to be defined when no value present on a given path.
     *
     * @param {Object} attributes
     * @returns {OgResource}
     */
    defaults(attributes) {

        this.$defaults = merge(this.$defaults, attributes);

        return this;
    }

    /**
     * Set an attribute to be casted to given type.
     *
     * NOTE: When you cast a value, this means tha value should be fillable by the resource.
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

    /**
     * Set a given path in the current resource.
     *
     * @param {String} path
     * @param {*} value
     * @returns {OgResource}
     */
    set(path, value) {

        if (!this.isFillable(path)) {
            return this;
        }

        set(this.$attributes, path, OgCast.cast(
            this.$api,
            path,
            this.$casts,
            value,
        ));

        return this;
    }

    /**
     * Get the value of a given path.
     *
     * @param {String} path
     * @param {*} defaultValue
     * @returns {*}
     */
    get(path, defaultValue = null) {

        const value = get(this.$attributes, path);

        if (!value) {
            return get(this.$defaults, path, defaultValue);
        }

        return value;
    }

    /**
     * Determine whether or not a given path has a value.
     *
     * NOTE: A path with a value NULL is considered not filled.
     *
     * @param {String} path
     * @returns {boolean}
     */
    filled(path) {
        return get(this.$attributes, path, null) !== null;
    }

    /**
     * @returns {Object}
     */
    toJSON() {
        const out = {
            $key: this.$key
        };
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

    isFillable(path) {

        if (this.$fillable.includes(path)) {
            return true;
        }

        if (this.isPathResource(path)) {
            return this.get(OgCast.root(path)).isFillable(OgCast.suffix(path));
        }

        return false;
    }

    isPathResource(path) {
        return OgCast.pathIsResource(path, this.$casts);
    }

    /**
     * @returns {String|Number}
     */
    get primaryKeyValue() {
        return this.get(this.$primaryKey);
    }

    schema(deep = 1) {

        const schema = {};

        Object
            .keys(this.$casts)
            .forEach(path => {

                const castedValue = OgCast.cast(
                    this.$api,
                    path,
                    this.$casts,
                    get(this.$defaults, path, null),
                );

                set(schema, path, castedValue);
            });

        return schema;
    }

    get api() {
        return this.$api;
    }

    get response() {
        return this.$response;
    }

    get attributes() {
        return this.$attributes;
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
}
