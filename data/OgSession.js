export default class OgSessionStorage {
  constructor() {}

  set(path, value) {
    if (this.SUPPORTED) {
      this.engine.setItem(path, JSON.stringify(value));
    } else {
      super.set(path, value);
    }
    return this;
  }

  get(path, defaultValue = null) {
    if (this.SUPPORTED && this.has(path)) {
      return JSON.parse(this.engine.getItem(path));
    }
    return super.get(path, defaultValue);
  }

  all() {
    if (!this.SUPPORTED) {
      return {};
    }
    const out = {};
    Object.keys(this.engine).forEach(path => {
      out[path] = this.get(path, null);
    });
    return out;
  }

  clear() {
    if (!this.SUPPORTED) {
      return this;
    }
    Object.keys(this.engine).forEach(path => this.engine.removeItem(path));
    return this;
  }

  has(path) {
    if (this.SUPPORTED) {
      const value = this.engine.getItem(path);
      return value === "undefined" ? false : !!value;
    }
    return false;
  }

  get engine() {
    return window.sessionStorage;
  }

  get SUPPORTED() {
    return this.engine && this.engine.setItem;
  }
}
