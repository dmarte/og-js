export default class OgPagination {
  /**
   * @param {Object} attributes
   */
  constructor(attributes = {}) {
    this.$meta = {
      perPage: this.PER_PAGE,
      currentPage: 1,
      lastPage: 1,
      from: 0,
      to: 0,
      total: 0
    };
    this.fill(attributes);
  }

  fill(meta) {
    this.$meta.perPage = this.getPerPageFromMeta(meta);
    this.$meta.currentPage = this.getCurrentPageFromMeta(meta);
    this.$meta.lastPage = this.getLastPageFromMeta(meta);
    this.$meta.total = meta.total || 0;
    this.$meta.from = meta.from || 0;
    this.$meta.to = meta.to || 0;
    return this;
  }

  reset() {
    this.fill({
      perPage: this.PER_PAGE,
      currentPage: 1,
      lastPage: 1,
      from: 0,
      to: 0,
      total: 0
    });
  }

  getLastPageFromMeta(meta) {
    return meta.lastPage || meta.last_page || this.$meta.lastPage;
  }

  getPerPageFromMeta(meta) {
    return parseInt(meta.perPage) || parseInt(meta.per_page) || this.PER_PAGE;
  }

  getCurrentPageFromMeta(meta) {
    return (
      meta.currentPage ||
      meta.current_page ||
      meta.page ||
      this.$meta.currentPage
    );
  }

  toServer() {
    return {
      page: this.$meta.currentPage,
      per_page: this.$meta.perPage
    };
  }

  toString() {
    if (this.$meta.total < 1) {
      return "";
    }
    return this.$meta.total;
  }

  toJSON() {
    return this.$meta;
  }

  get perPage() {
    return parseInt(this.$meta.perPage) || OgPagination.DEFAULT_PER_PAGE;
  }

  set perPage(value) {
    if (!value) {
      this.$meta.perPage = this.PER_PAGE;
    }
    this.$meta.perPage = value || OgPagination.DEFAULT_PER_PAGE;
  }

  get currentPage() {
    return this.$meta.currentPage;
  }

  set currentPage(value) {
    if (!value) {
      return;
    }
    this.$meta.currentPage = parseInt(value) || 0;
  }

  get lastPage() {
    return this.$meta.lastPage;
  }

  set lastPage(value) {
    this.$meta.lastPage = parseInt(value);
  }

  get from() {
    return this.$meta.from;
  }

  set from(value) {
    this.$meta.from = parseInt(value) || 0;
  }

  get to() {
    return this.$meta.to;
  }

  set to(value) {
    this.$meta.to = parseInt(value);
  }

  get total() {
    return this.$meta.total;
  }

  set total(value) {
    this.$meta.to = parseInt(value);
  }

  get PER_PAGE() {
    return OgPagination.DEFAULT_PER_PAGE;
  }

  static get DEFAULT_PER_PAGE() {
    return 15;
  }
}
