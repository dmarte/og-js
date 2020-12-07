import _ from 'lodash';
import OgQueryBuilder from './OgQueryBuilder';
import OgPagination from './OgPagination';
import OgResource from './OgResource';

export default class OgCollection extends OgQueryBuilder {
    /**
     * @param {OgApi} api
     * @param {OgResource} collector
     * @param {String} path
     */
    constructor(api, collector, path = null) {
        super();
        this.$elements = [];
        this.$collector = collector;
        this.$paginate = new OgPagination();
        this.$loading = false;
        this.$api = api;
        this.$path = path;
        this.scope();
    }

    static build(api, collection, items) {
        return new collection(api).setItems(!Array.isArray(items) ? [] : items);
    }

    abort() {
        this.$api.abort();
        return this;
    }

    reset() {
        super.reset();
        this.$loading = false;
        this.scope();
        return this;
    }

    /**
     * @param {String} primaryKeyValue
     * @returns {OgResource|null}
     */
    findByPrimaryKey(primaryKeyValue) {
        const resource = this.items.find(
            item => item.primaryKeyValue === primaryKeyValue,
        );
        if (!resource) {
            return OgResource.build(this.$api, this.$collector, this.$collector.$defaults);
        }

        return resource;
    }

    /**
     * Find an item by given index.
     *
     * NOTE:
     * If the item not exists it will create an empty collector resource.
     *
     * @param {Number} index
     * @returns {OgResource|*}
     */
    findByIndex(index) {
        if (!this.items[index]) {
            return OgResource.build(this.$api, this.$collector, this.$collector.$defaults);
        }

        return this.items[index];
    }

    /**
     * @returns {OgResource}
     */
    first() {
        return this.items[0] || this.findByPrimaryKey();
    }

    /**
     * @param {Number|String} value
     * @returns {Promise<OgCollection>}
     */
    async deleteFromPrimaryKey(value) {
        this.$loading = true;
        const resource = await this.findByPrimaryKey(value);
        await resource.delete();
        this.$loading = false;
        if (resource.$response.failed) {
            throw new Error(resource.$response.message);
        }
        return this;
    }

    /**
     * @param {OgResource} resource
     * @returns {Promise<OgCollection>}
     */
    async deleteFromResource(resource) {

        this.$loading = true;

        if (resource.primaryKeyValue) {
            await resource.delete();
        }

        this.$loading = false;

        if (resource.$response.failed) {

            throw new Error(resource.$response.message);

        }

        this.remove(resource);

        return this;
    }

    /**
     * @param {String} search
     * @param {String} key
     * @returns {Promise<OgCollection>}
     */
    async dropdown(search = null, key = 'dropdown') {

        this.$loading = true;

        const query = (new super.constructor()).where(key, true);

        query.where(super.toJSON());

        if (search) {

            query.query(search);

        }

        const response = await this.$api.get(this.$path, query);

        if (response.failed) {

            this.$loading = false;

            throw new Error(response.message);

        }

        if (Array.isArray(response.data)) {

            this.setItems(response.data);

        }

        this.$loading = false;

        return this;
    }

    /**
     * @param {String} query
     * @returns {Promise<OgCollection>}
     */
    async paginateFromQuery(query) {
        if (!query) {
            query = {};
        }
        const perPage = query.perPage || this.paginator.perPage;
        const currentPage = query.currentPage || this.paginator.currentPage;
        const sortBy = query.sortBy || 'id';
        const sortDesc = query.sortDesc === 'true' || false;
        await this.paginate(currentPage, perPage, sortBy, sortDesc);
        return this;
    }

    async paginate(page = null, perPage = null, sortBy = 'id', sortDesc = true) {

        if (perPage) {
            this.perPage(perPage);
        }

        if (page) {
            this.currentPage(page);
        }

        this.$paginate.sortBy = sortBy;

        this.$paginate.sortDesc = sortDesc;

        this.$loading = true;

        super.page(this.$paginate.currentPage);

        super.perPage(this.$paginate.perPage);

        super.sortBy(this.$paginate.sortBy, this.$paginate.sortDesc);

        const response = await this.$api.get(this.$path, super.toJSON());

        if (response.failed) {
            this.$loading = false;
            throw new Error(response.message);

        }

        if (response.data.meta) {

            this.$paginate.fill(response.data.meta);

        }

        if (Array.isArray(response.data.data)) {

            this.reset();

            const Resource = this.collector;

            this.$elements = response.data.data.map(
                item => OgResource.build(this.$api, Resource, item),
            );

        }
        this.$loading = false;
        return this;
    }

    /**
     * Save the collection of items.
     *
     * @returns {Promise<{success: [], failed: [], ok: boolean}>}
     */
    async saveEachOne() {

        this.$loading = true;

        const responses = [];

        await Promise.all(
            this.items.map(async (item, index) => {
                responses.push({
                    index,
                    failed: !await item.save(),
                    response: item.response,
                });
            }),
        );

        this.$loading = false;

        const ok = !responses.some(({ response }) => response.failed);

        return {
            responses,
            ok,
            message: ok ? 'All resources saved.' : 'There was an error saving your changes.',
        };
    }

    /**
     * This option let you remove a resource from
     * the given collection.
     *
     * @param {OgResource} item
     * @returns {boolean}
     */
    remove(item) {

        const index = this.$elements.findIndex(
            ({ primaryKeyValue }) => primaryKeyValue === item.primaryKeyValue,
        );

        if (index < 0) {
            return false;
        }

        this.$elements.splice(index, 1);

        return true;
    }

    /**
     * Set the amount of items per page
     * to reach.
     *
     * @param {Number} value
     * @returns {OgCollection}
     */
    perPage(value) {
        this.paginator.perPage = value;
        return this;
    }

    currentPage(value) {
        this.paginator.currentPage = value;
        return this;
    }

    /**
     * Defined method to predefine some "where" conditions
     * to always be present on each request
     * made by the collection.
     * @return {OgCollection}
     */
    scope() {}

    /**
     * Get a { value, text } object from the list
     * useful to be used for dropdown or select forms.
     *
     * @param {String} pathText
     * @param {String} pathValue
     * @param {String} emptyText
     * @param {*} emptyValue
     * @returns {{text, value: *}[]}
     */
    pluck(pathText, pathValue, emptyText = null, emptyValue = null) {
        const items = [];

        if (emptyText) {
            items.push({
                value: emptyValue,
                text: emptyText,
            });
        }

        this.items.forEach((item) => items.push({
            value: _.get(item, pathValue || 'id', null),
            text: _.isFunction(pathText) ? pathText(item) : _.get(item, pathText || 'text', null),
        }));

        return items;
    }

    toJsonItems() {
        return this.$elements.map(item => item.toJSON());
    }

    toJSON() {
        return {
            meta: this.$paginate.toJSON(),
            items: this.toJsonItems(),
        };
    }

    setItems(items = []) {
        const Collector = this.$collector;
        this.$elements = items.map(item => OgResource.build(this.$api, Collector, item));
        return this;
    }

    add(item, index = undefined) {

        const Collector = this.$collector;

        const instance = OgResource.build(this.$api, Collector, item);

        if (index) {

            this.$elements.splice(index, 1, instance);

        } else {

            this.$elements.push(instance);

        }

        return instance;
    }

    /**
     * @param {Object} item
     * @returns {OgResource}
     */
    push(item) {
        if(item instanceof this.$collector) {
            this.$elements.push(item);
            return item;
        }
        return this.add(item);
    }

    get length() {
        return this.items.length;
    }

    get items() {
        return this.$elements;
    }

    get collector() {
        return this.$collector;
    }

    set collector(collector) {
        this.$collector = collector;
    }

    get paginator() {
        return this.$paginate;
    }

    get IS_LOADING() {
        return this.$loading;
    }

    get IS_EMPTY() {
        return this.length < 1;
    }
}
