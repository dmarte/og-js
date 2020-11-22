/**
 * Cast class base for resources.
 * @author Delvi Marte <dmarte@famartech.com>
 */
export default class OgResourceCast {
    /**
     * @param {OgApi} api
     * @param {*} value
     */
    constructor(api, value) {
        this.$value = value;
        this.$api = api;
    }

    static build(api, type, value) {
        return new Proxy(new type(api, value), {
            // Allow use ResourceCast as arrays
            get(target, p, receiver) {

                if (typeof p === 'string' && /^[\d]$/s.test(p)) {
                    return target.value[p] || null;
                }

                return Reflect.get(target, p, receiver);
            },

            set(target, p, value, receiver) {

                if (typeof p === 'string' && /^[\d]$/s.test(p)) {
                    return target.$value[p] = value;
                }

                return Reflect.set(target, p, receiver);
            },
        });
    }

    get api() {
        return this.$api;
    }

    get value() {
        return this.$value;
    }

    set value(value) {
        this.$value = value;
    }

    toJSON() {
        if (this.IS_STRING) {
            return this.toString();
        }
        return JSON.parse(JSON.stringify(this.$value));
    }

    toString() {
        return this.$value;
    }

    get IS_OBJECT() {
        return _.isObject(this.$value);
    }

    get IS_STRING() {
        return _.isString(this.$value);
    }

    get IS_INTEGER() {
        return _.isInteger(this.$value);
    }

    get IS_DECIMAL() {
        return _.isNumber(this.$value) && this.$value % 1 !== 0;
    }
}
