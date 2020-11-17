import OgResourceCast from './OgResourceCast';

export default class OgResourceDateCast extends OgResourceCast {
    constructor(api, value) {
        super(api, null);
        this.$value = value ? DateTime.fromISO(value) : DateTime.utc();
        this.$format = DateTime.DATETIME_MED;
    }

    set settings(format) {
        this.$format = format;
    }

    get settings() {
        return this.$format;
    }

    get date() {
        return this.$value.toJSDate();
    }

    set date(value) {
        this.$value = DateTime.fromJSDate(value);
    }

    get empty() {
        return !this.$value;
    }

    get formatted() {
        if (!this.$value.isValid) {
            return '';
        }

        return this.$value
            .setLocale(this.$config.language)
            .toLocaleString({ ...this.$format, hour12: true });
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
        if (this.empty) {
            return '';
        }

        return this.$value.toSQL();
    }
}
