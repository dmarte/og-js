import OgResource from '../http/OgResource';
import OgCast from './OgCast';
import OgResourceCast from './OgResourceCast';
import { toNumber } from 'lodash';

export default class OgResourceArrayCast extends OgResourceCast {
    /**
     * @param {OgApi} api
     * @param {Array} value
     * @param {OgResource} resource
     */
    constructor(api, value = [], resource) {

        super(api, []);

        if (Array.isArray(value) && value.length > 0) {

            this.$value = value.map((item) => {

                if (OgCast.isResource(resource)) {

                    return OgResource.build(api, resource, item);

                }

                return item;

            });
        }

        this.$collector = resource;

    }

    /**
     * Add a new instance of a given collector resource.
     *
     * @param {Object|OgResource} attributes
     * @returns {OgResourceArrayCast}
     */
    add(attributes) {
        this.$value.push(new this.$collector(this.api, attributes));
        return this;
    }

    /**
     * Delete a given Item by the index offset.
     *
     * @param {Number} index
     * @returns {OgResourceArrayCast}
     */
    delete(index) {

        this.throwErrorIfOffsetNotExists(index);

        this.$value.splice(index, 1);

        return this;
    }

    /**
     * Remove a given resource from the collection.
     * @param {OgResource} resource
     * @throws Error
     * @return {self}
     */
    remove(resource) {

        const index = this.findIndexByResourceKey(resource.$key);

        if (index < 0) {

            OgResourceArrayCast.throwResourceNotExist(resource.constructor.name);

            return this;

        }

        this.delete(index);

        return this;
    }

    /**
     * Verify if a given resource is exists
     * in the collection.
     *
     * @param {OgResource} resource
     * @return {boolean}
     */
    exists(resource) {
        return this.value.some(({ $key }) => $key === resource.$key);
    }

    /**
     * Get a given offset resource.
     *
     * @param {Number} index
     * @throws Error
     * @returns {OgResource}
     */
    offset(index) {

        this.throwErrorIfOffsetNotExists(index);

        return this.value[index];
    }

    /**
     * @param {Number} key
     * @returns {Number}
     */
    findIndexByResourceKey(key) {
        // Be sure always to be a number.
        key = toNumber(key);

        return this.value.findIndex(({ $key }) => $key === key);
    }

    /**
     * Verify if a given offset exists.
     *
     * @param {Number} number
     * @returns {boolean}
     */
    hasIndex(number) {
        return !!this.value[number];
    }

    throwErrorIfOffsetNotExists(offset) {

        if (!this.hasIndex(offset)) {

            OgResourceArrayCast.throwNotExistOffset(offset);

        }
    }

    static throwNotExistOffset(offset) {
        throw new Error(`ERROR_OFFSET_NOT_EXISTS:${offset}`);
    }

    static throwResourceNotExist(name) {
        throw new Error(`ERROR_RESOURCE_NOT_EXITS:${name}`);
    }

    /**
     * Get the count.
     *
     * @returns {Number}
     */
    get length() {
        return this.value.length;
    }
}
