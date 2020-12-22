import OgQueryString from './OgQueryString';

export default class OgQueryBuilder extends OgQueryString {
    constructor(path = '/', base = null) {
        super(path, base);
    }

    with(key) {
        if (Array.isArray(key)) {
            keys.forEach((value) => this.where('with', value));
            return;
        }
        this.where('with', key);
        return this;
    }

    query(value) {
        if (!value) {
            return this;
        }
        this.where('q', value);
        return this;
    }

    sortBy(field, asc = false) {
        this.where('sort.by', field, true);
        this.where('sort.order', asc ? 'asc' : 'desc', true);
        return this;
    }

    page(pageNum = 1) {
        this.where('page', pageNum, true);
        return this;
    }

    perPage(numberOfPages = 15) {
        this.where('pagination.per_page', numberOfPages, true);
        return this;
    }

}
