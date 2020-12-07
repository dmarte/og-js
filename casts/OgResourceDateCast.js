import OgResourceCast from './OgResourceCast';
import { DateTime } from 'luxon';

/**
 * @property $value DateTime
 */
export default class OgResourceDateCast extends OgResourceCast {
    constructor(api, value) {
        super(api, null);
        this.$value = value ? DateTime.fromISO(value) : DateTime.utc();
        this.$format = DateTime.DATETIME_MED;
    }

    plus(object) {
        this.$value = this.$value.plus(object);
        return this;
    }

    setDateSql(value) {
        return this.merge(DateTime.fromSQL(value));
    }

    setDateJS(date) {
        return this.merge(DateTime.fromJSDate(date));
    }

    merge(dt) {
        this.$value = dt;
        return this;
    }

    useShortDate() {
        this.$format = DateTime.DATE_SHORT;
        return this;
    }

    useWithoutTime() {
        this.$format = DateTime.DATE_MED;
        return this;
    }

    toString() {
        if (this.isEmpty) {
            return '';
        }

        return this.$value.toSQLDate();
    }

    format(language) {
        if (!this.$value.isValid) {
            return '';
        }

        return this.$value
            .setLocale(language)
            .toLocaleString({ ...this.$format, hour12: true });
    }

    get toDateSQL() {
        return this.$value.toSQLDate();
    }

    get toDateJs() {
        return this.$value.toJSDate();
    }

    set settings(format) {
        this.$format = format;
    }

    get settings() {
        return this.$format;
    }

    get isEmpty() {
        return !this.$value;
    }

}
