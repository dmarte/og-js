import { toArray, toPlainObject, toSafeInteger, toString } from 'lodash';
import OgCollection from '../http/OgCollection';
import OgResource from '../http/OgResource';
import OgResourceCast from './OgResourceCast';
import OgResourceDateCast from './OgResourceDateCast';

export default class OgCast {

    static root(path) {
        path = String(path);

        const index = path.indexOf('.');

        return index < 0 ? path : path.substr(0, index);
    }

    static suffix(path) {

        path = String(path);

        const index = path.indexOf('.');

        if (index < 0) {
            return path;
        }

        return path.substr(index + 1);
    }

    static pathIsResource(path, casts = {}) {

        path = OgCast.root(path);

        return casts[path] ? OgCast.isResource(casts[path]) : false;
    }

    static isResource(value) {
        return Object.prototype.isPrototypeOf.call(OgResource, value);
    }

    static isCollection(value) {
        return Object.prototype.isPrototypeOf.call(OgCollection, value);
    }

    static isCast(value) {
        return Object.prototype.isPrototypeOf.call(OgResourceCast, value);
    }

    static cast(api, key, casts = {}, value = null) {

        if (!casts[key]) {
            return value;
        }

        if (value instanceof OgResource || value instanceof OgCollection || value instanceof OgResourceCast) {
            return value;
        }

        const Type = casts[key];

        if (OgCast.isCast(Type)) {
            return OgResourceCast.build(api, Type, value);
        }

        if (OgCast.isResource(Type)) {
            return OgResource.build(api, Type, value);
        }

        if (OgCast.isCollection(Type)) {
            return OgCollection.build(api, Type, value);
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
                output = value || '';
                break;
            case OgCast.TYPE_ARRAY:
                output = toArray(value);
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
