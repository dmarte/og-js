export default class OgApiResponse {
    /**
     * @param {Object} data
     * @param {Number} status
     * @param {String} message
     */
    constructor(data = {}, status = 200, message = '') {
        this.$status = status;
        this.$data = data;
        this.$message = message;
        this.$feedbacks = OgApiResponse.parseErrors(data);
    }

    static parseMessage(data = {}, defaults = '') {
        if (!data || !data.message) {
            return defaults;
        }
        return data.message;
    }

    static parseErrors(data = {}) {
        if (!data || !data.errors) {
            return {};
        }
        const out = {};
        Object.keys(data.errors).forEach(key => {
            const field = data.errors[key];
            if (!Array.isArray(field)) {
                return;
            }
            out[key] = field.shift();
        });
        return out;
    };

    /**
     * Verify if a given field has an error in the current
     * response.
     *
     * @param {String} field
     * @returns {boolean}
     */
    fail(field) {
        return !!this.$feedbacks[field];
    }

    /**
     * Returns FALSE when field failed in response.
     * Returns NULL when field not exists in response.
     *
     * @param {String} field
     * @returns {null|boolean}
     */
    state(field) {
        if (this.fail(field)) {
            return false;
        }
        return null;
    }

    /**
     * Get a response error for a given field.
     *
     * @param {String} field
     * @returns {null|String}
     */
    feedback(field) {
        if (!this.fail(field)) {
            return null;
        }
        return this.resolveResponseValidationKey(field).message || '';
    }

    reset() {
        this.$status = 200;
        this.$data = {};
        this.$message = '';
        this.$feedbacks = {};
        return this;
    }

    resolveResponseValidationKey(field) {
        if (!this.fail(field)) {
            return { attribute: null, rule: null, value: null, message: null };
        }
        const key = this.$feedbacks[field];
        // Get the rules
        const rules = String(key)
            .replace('validation.', '')
            .split(',');
        const rule = rules.shift();
        // Any other value should be values separated by /
        const value = rules.map(value => value.trim()).join(', ');

        const attribute = field;
        const message = rule;

        return { attribute, message, value: value || '', rule };
    }

    get message() {
        return OgApiResponse.parseMessage(this.$data, this.$message);
    }

    get messages() {
        return this.$feedbacks;
    }

    get failed() {
        return [
            OgApiResponse.HTTP_TOKEN_MISMATCH,
            OgApiResponse.HTTP_BAD_REQUEST,
            OgApiResponse.HTTP_UNAUTHORIZED,
            OgApiResponse.HTTP_NOT_FOUND,
            OgApiResponse.HTTP_NO_METHOD_ALLOWED,
            OgApiResponse.HTTP_REQUEST_TIMEOUT,
            OgApiResponse.HTTP_SERVER_ERROR,
            OgApiResponse.HTTP_PAGE_EXPIRED,
            OgApiResponse.HTTP_UNPROCESSABLE_ENTITY,
        ].includes(this.$status);
    }

    get success() {
        return [
            OgApiResponse.HTTP_OK,
            OgApiResponse.HTTP_CREATED,
            OgApiResponse.HTTP_ACCEPTED,
            OgApiResponse.HTTP_NO_CONTENT,
            OgApiResponse.HTTP_RESET_CONTENT,
        ].includes(this.$status);
    }

    toJSON() {
        return {
            message: this.message,
            status: this.$status,
            data: this.$data,
        };
    }

    get data() {
        return this.$data;
    }

    get status() {
        return this.$status;
    }

    get FAILED_BY_SESSION_EXPIRE() {
        if (
            this.status === OgApiResponse.HTTP_UNAUTHORIZED &&
            this.message === 'Unauthenticated.'
        ) {
            return true;
        }
        return [OgApiResponse.HTTP_TOKEN_MISMATCH].includes(this.status);
    }

    static get HTTP_OK() {
        return 200;
    }

    static get HTTP_CREATED() {
        return 201;
    }

    static get HTTP_ACCEPTED() {
        return 202;
    }

    static get HTTP_NO_CONTENT() {
        return 204;
    }

    static get HTTP_RESET_CONTENT() {
        return 205;
    }

    static get HTTP_TOKEN_MISMATCH() {
        return 419;
    }

    static get HTTP_BAD_REQUEST() {
        return 400;
    }

    static get HTTP_UNAUTHORIZED() {
        return 401;
    }

    static get HTTP_NOT_FOUND() {
        return 404;
    }

    static get HTTP_NO_METHOD_ALLOWED() {
        return 405;
    }

    static get HTTP_REQUEST_TIMEOUT() {
        return 408;
    }

    static get HTTP_SERVER_ERROR() {
        return 500;
    }

    static get HTTP_PAGE_EXPIRED() {
        return 419;
    }

    static get HTTP_UNPROCESSABLE_ENTITY() {
        return 422;
    }
}
