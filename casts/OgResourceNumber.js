import OgResourceCast from './OgResourceCast';

export default class OgResourceNumber extends OgResourceCast {
    constructor(api, value) {
        super(api, value);
        this.$format = OgNumberCast.FORMAT_STANDARD;
        this.$settings = {
            locale: 'en-US',
            currency: 'USD',
            currencyDisplay: 'code',
            currencySign: 'accounting',
            notation: 'standard',
            style: 'currency',
            signDisplay: 'auto',
        };
    }

    // TODO: Prepare short format.
    withFormatShort() {
        return this;
    }

    // TODO: Prepare standard format.
    withFormatStandard() {
        return this;
    }

    // TODO: Prepare special accounting format.
    withFormatAccounting() {
        return this;
    }

    toString() {
        return Intl.NumberFormat(this.$settings.locale, this.options).format(
            this.$value,
        );
    }

    get value() {
        return super.value || 0;
    }

    set value(value) {
        this.$value = parseFloat(value) || 0;
    }

    get settings() {
        return this.$format;
    }

    toJSON() {
        return this.value;
    }

    set settings(format) {
        if (!OgNumberCast.FORMAT_TYPES.includes(format)) {
            return;
        }
        this.$format = format;
    }

    get options() {
        switch (this.$format) {
            case OgNumberCast.FORMAT_ACCOUNTING:
                this.withFormatAccounting();
                break;
            case OgNumberCast.FORMAT_STANDARD:
                this.withFormatStandard();
                break;
            case OgNumberCast.FORMAT_STANDARD_SHORT:
                this.withFormatShort().withFormatStandard();
                break;
        }

        return {
            currency: this.$settings.currency,
            currencyDisplay: this.$settings.currencyDisplay,
            currencySign: this.$settings.currencySign,
            notation: this.$settings.notation,
            style: this.$settings.style,
            signDisplay: this.$settings.signDisplay,
        };
    }

    static get FORMAT_TYPES() {
        return [
            OgNumberCast.FORMAT_STANDARD,
            OgNumberCast.FORMAT_STANDARD_SHORT,
            OgNumberCast.FORMAT_ACCOUNTING,
        ];
    }

    static get FORMAT_STANDARD() {
        return 'standard';
    }

    static get FORMAT_ACCOUNTING() {
        return 'accounting';
    }

    static get FORMAT_STANDARD_SHORT() {
        return 'standard_short';
    }
}
