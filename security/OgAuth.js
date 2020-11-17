import OgApiResponse from '../http/OgApiResponse';
import OgCookie from '../data/OgCookie';
import OgSession from '../data/OgSession';
import OgUserResource from './OgUserResource';
import OgQueryBuilder from '../http/OgQueryBuilder';

export default class OgAuth extends OgQueryBuilder {
    /**
     *
     * @param {OgApi} api
     * @param {Object} options
     */
    constructor(
        api,
        options = {
            URL_PATH_LOGIN: 'login',
            URL_PATH_USER: 'login/user',
            KEY_SESSION_USER: 'ogo_user',
            KEY_SESSION_TOKEN: 'ogo_token',
            USER_RESOURCE: OgUserResource,
        },
    ) {
        super();
        this.$api = api;
        this.$user = null;
        this.$response = new OgApiResponse();
        this.$cookie = new OgCookie();
        this.$session = new OgSession();
        this.$settings = {
            URL_PATH_LOGIN: options.URL_PATH_LOGIN || '',
            URL_PATH_USER: options.URL_PATH_USER || 'login/user',
            KEY_SESSION_USER: options.KEY_SESSION_USER || 'ogo_user',
            KEY_SESSION_TOKEN: options.KEY_SESSION_TOKEN || 'ogo_token',
            USER_RESOURCE: options.USER_RESOURCE || OgUserResource,
        };
        this.setTokenFromSession();
        this.setUserFromSession();
    }

    get KEY_TOKEN() {
        return this.$settings.KEY_SESSION_TOKEN;
    }

    get KEY_USER() {
        return this.$settings.KEY_SESSION_USER;
    }

    get USER_RESOURCE() {
        return this.$settings.USER_RESOURCE;
    }

    setTokenFromSession() {
        if (this.$session.has(this.KEY_TOKEN)) {
            this.setToken(this.$session.get(this.KEY_TOKEN));
        }
        return this;
    }

    setUserFromSession() {
        if (this.$session.has(this.KEY_USER)) {
            this.setUser(this.$session.get(this.KEY_USER));
        }
        return this;
    }

    async register(name, email, password) {

        this.$response = await this.$api.post('register', {
            name,
            email,
            password,
            device: window.location.hostname,
        });

        if (this.$response.failed) {

            throw new Error(this.$response.message);

        }

        await this.loginWithSanctum(email, password);

        return this;
    }

    async loginWithSanctum(email, password) {

        await this.logout();

        // Get the cookie
        this.$response = await this.$api.get('/sanctum/csrf-cookie');

        if (this.$response.failed) {

            throw new Error(this.$response.message);

        }

        // Include cookies in each request.
        this.$api.withCredentials();

        // Include the cookie header for xsrf
        this.$api.withCookeXSRFHeader();

        this.$response = await this.$api.post(this.$settings.URL_PATH_LOGIN, {
            email,
            password,
            device: window.location.hostname,
        });

        this.setToken(this.$response.data.token);

        if (this.$response.failed) {

            throw new Error(this.$response.message);

        }

        await this.fetchUser();

        return this;
    }

    /**
     * Fetch the user from the API
     * or get from the current session.
     *
     * @returns {Promise<OgUserResource>}
     */
    async fetchUser() {

        if (this.$user instanceof OgUserResource) {

            return this.$user;

        }

        if (this.$session.has(this.KEY_USER)) {

            this.setUserFromSession();

            return this.$user;
        }

        this.$response = await this.$api.get(
            this.$settings.URL_PATH_USER,
            super.toJSON(),
        );

        if (this.$response.failed) {
            // Close the session
            this.logout();

            throw new Error(this.$response.message);

        }

        this.$session.set(this.KEY_USER, this.$response.data);

        this.setUserFromSession();

        return this.$user;
    }

    /**
     * This method is used to set the token
     * in the API to be able to make requests
     * that require authentication.
     *
     * @param {String} token
     * @returns {OgAuth}
     */
    setToken(token) {
        this.$session.set(this.$settings.KEY_SESSION_TOKEN, token);
        this.$api.authorization(token);
        return this;
    }

    /**
     * Set the user in the instance.
     *
     * @param object
     * @returns {OgAuth}
     */
    setUser(object) {

        this.$user = new this.USER_RESOURCE(
            this.$api,
            object,
        );

        return this;
    }

    /**
     * @returns {OgAuth}
     */
    logout() {
        this.$session.clear();
        this.$cookie.clear();
        this.$api.reset();
        this.$user = null;
        delete this.$api.$headers.Authorization;
        return this;
    }

    /**
     *  This method let you change
     *  the default user resource used by the
     *  auth provider.
     *
     * @param {OgResource} resource
     * @returns {OgAuth}
     */
    use(resource) {
        this.$settings.USER_RESOURCE = resource;
        return this;
    }

    /**
     * Get current authenticated user
     * or empty user instance.
     *
     * @returns {OgUserResource|OgResource}
     */
    get user() {
        if (this.$user) {
            return this.$user;
        }

        const Resource = this.USER_RESOURCE || OgUserResource;

        return new Resource(this.$api);
    }

    get id() {
        return this.user.id || null;
    }

    get response() {
        return this.$response;
    }

    /**
     * @returns {boolean}
     */
    get guest() {
        if (this.$session.has(this.KEY_USER)) {
            return false;
        }

        return !this.$session.has(this.KEY_TOKEN);
    }

    get logged() {
        return !this.guest || this.id;
    }
}
