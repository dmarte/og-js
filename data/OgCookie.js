export default class OgCookie {
  constructor() {
    this.$cookies = [];
    this.initialize();
  }

  initialize() {
    this.$cookies = document.cookie
      .split(";")
      .map(item => item.trim().split("="))
      .map(item => ({ key: item[0], value: decodeURIComponent(item[1]) }));
    return this;
  }

  has(key) {
    this.initialize();
    return this.$cookies.some(cookie => cookie.key === key);
  }

  get(key) {
    this.initialize();
    const cookie = this.$cookies.find(cookie => cookie.key === key);
    if (!cookie) {
      return null;
    }
    return cookie.value || null;
  }

  clear() {
    const cookies = document.cookie.split(";");

    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i];
      const eqPos = cookie.indexOf("=");
      const name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
      document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT";
    }
  }

  toJSON() {
    const output = {};
    this.$cookies.forEach(({ key, value }) => {
      output[key] = value;
    });
    return output;
  }
}
