import OgQueryString from "./OgQueryString";
import OgApiResponse from "./OgApiResponse";
import OgCookie from "../data/OgCookie";

export default class OgApi extends OgQueryString {
  constructor(base, prefix = "/") {
    super();
    this.$prefix = prefix;
    this.$url = new URL(this.$prefix, base);
    this.$headers = new Headers();
    this.$credentialsType = "same-origin";
    this.$cancelToken = new AbortController();
  }

  abort() {
    this.$cancelToken.abort();
    this.$cancelToken = new AbortController();
    return this;
  }

  authorization(token) {
    this.$headers.set("Authorization", `Bearer ${token}`);
    return this;
  }

  contentTypeJson() {
    this.$headers.set("Content-Type", "application/json");
    return this;
  }

  acceptJson() {
    this.$headers.set("Accept", "application/json");
    return this;
  }

  withCredentials(type = "include") {
    this.$credentialsType = type;
    return this;
  }

  withXSRFHeader(token) {
    this.header("X-XSRF-TOKEN", token);
    return this;
  }

  header(key, value) {
    this.$headers.set(key, value);
    return this;
  }

  withCookeXSRFHeader() {
    const cookie = new OgCookie();
    if (!cookie.has("XSRF-TOKEN")) {
      return this;
    }
    this.withXSRFHeader(cookie.get("XSRF-TOKEN"));
    return this;
  }

  request(
    path,
    method = "GET",
    data = undefined,
    mode = "cors",
    signal = undefined
  ) {
    this.$url.pathname =
      String(path).charAt(0) === "/" ? path : `${this.$prefix}/${path}`;
    this.$url.search = super.toString();

    return new Request(this.$url.toString(), {
      method,
      mode,
      headers: this.$headers,
      body: data && method !== "GET" ? JSON.stringify(data) : undefined,
      credentials: this.$credentialsType,
      signal: signal ? signal.signal : this.$cancelToken.signal
    });
  }

  async post(
    path,
    data = undefined,
    queryString = undefined,
    signal = undefined
  ) {
    this.reset();

    this.where(queryString);

    this.contentTypeJson().acceptJson();

    const resp = await fetch(this.request(path, "POST", data, "cors", signal));

    return new OgApiResponse(
      resp.status !== OgApiResponse.HTTP_NO_CONTENT ? await resp.json() : {},
      resp.status,
      resp.statusText
    );
  }

  async get(path, queryString = undefined, signal = undefined) {
    this.reset();

    this.where(queryString);

    this.acceptJson();

    const resp = await fetch(
      this.request(path, "GET", undefined, "cors", signal)
    );

    return new OgApiResponse(
      resp.status !== OgApiResponse.HTTP_NO_CONTENT ? await resp.json() : {},
      resp.status,
      resp.statusText
    );
  }

  reset() {
    super.reset();
    this.$cancelToken = new AbortController();
    return this;
  }
}
