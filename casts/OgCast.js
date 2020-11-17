import { isNumber, toArray, toPlainObject, toSafeInteger, toString } from 'lodash';
import OgCollection from '../http/OgCollection';
import OgResource from '../http/OgResource';
import OgResourceCast from './OgResourceCast';
import OgResourceDateCast from './OgResourceDateCast';

export default class OgCast {
    static cast(api, key, casts = {}, value = null) {
        if (!casts[key]) {
            return value;
        }

        const Type = casts[key];

        if (Object.prototype.isPrototypeOf.call(OgResourceCast, Type)) {
            return new Type(api, value);
        }

        if (Object.prototype.isPrototypeOf.call(OgResource, Type)) {
            return new Type(api, value);
        }

        if (Object.prototype.isPrototypeOf.call(OgCollection, Type)) {
            return new Proxy(new Type(api).setItems(!Array.isArray(value) ? [] : value), {
                get(target, p, receiver) {

                    if(typeof p === 'string' && /^[\d]$/s.test(p)) {
                        return target.findByIndex(p)
                    }

                    return Reflect.get(target, p, receiver);
                },

                set(target, p, value, receiver) {

                    if(typeof p === 'string' && /^[\d]$/s.test(p)) {
                        return target.add(value, p)
                    }

                    return Reflect.set(target, p, receiver);
                }
            });
        }

        let output;

        switch (Type) {
            case OgCast.TYPE_BOOLEAN:
                output = value ? Boolean(value) : false;
                break;
            case OgCast.TYPE_STRING:
                output = toString(value);
                break;
            case OgCast.TYPE_INTEGER:
                output = toSafeInteger(value) || 0;
                break;
            case OgCast.TYPE_DECIMAL:
                output = parseFloat(value) || 0.0;
                break;
            case OgCast.TYPE_ID:
                output = parseInt(value, 10) || null;
                break;
            case OgCast.TYPE_DATE:
                output = new OgResourceDateCast(api, value);
                break;
            case OgCast.TYPE_ARRAY:
                if (!Array.isArray(value)) {
                    output = toArray(value);
                }
                break;
            case OgCast.TYPE_OBJECT:
                output = toPlainObject(value);
                break;
            default:
                output = value;
                break;
        }

        return output;
    }

    static get TYPE_DATE() {
        return 'date';
    }

    static get TYPE_STRING() {
        return 'string';
    }

    static get TYPE_INTEGER() {
        return 'integer';
    }

    static get TYPE_DECIMAL() {
        return 'decimal';
    }

    static get TYPE_BOOLEAN() {
        return 'boolean';
    }

    static get TYPE_OBJECT() {
        return 'object';
    }

    static get TYPE_ARRAY() {
        return 'array';
    }

    static get TYPE_ID() {
        return 'id';
    }
}
