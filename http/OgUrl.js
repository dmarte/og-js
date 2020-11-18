export default class OgUrl {
    constructor(path, base) {
        this.setUrl(path, base);
        this.$bindings = this.parse(path);

    }

    setUrl(path, base) {
        this.$path = path;
        this.$base = base || window.location.origin;
        return this;
    }

    /**
     * Check if a given holder exists in the current path bindings.
     * @returns {Boolean}
     **/
    has(holder) {
        return this.$bindings.some(({ name }) => name.toLowerCase() === String(holder).toLowerCase());
    }

    /**
     * Bind a given placeholder in path URL to the given value.
     *
     * @param {String} key
     * @param {String} value
     * @returns {OgUrl}
     */
    bind(key, value) {
        if (!this.has(key)) {
            this.$bindings.push({
                original: `{${key}}`,
                name: key,
                value,
                required: false,
            });
            return this;
        }
        const index = this.$bindings.findIndex(({ name }) => name === String(key).toLowerCase());
        this.$bindings[index].value = value;
        return this;
    }

    /**
     * Get the value previously configured for a given url binding key.
     *
     * @param {String} key
     * @returns {null|*|null}
     */
    getBindingValue(key) {

        const binding = this.$bindings.find(({ name }) => name === key);

        if (binding && binding.value) {
            return binding.value;
        }

        return null;
    }

    /**
     * Generate the string path.
     * @returns {string}
     */
    toString() {
        return this.toURL().toString();
    }

    /**
     * Get the URL instance of a given URL
     * @param {String} path
     * @returns {URL}
     */
    toURL(path) {

        if (path.charAt(0) === '/') {
            return new URL(this.buildPathBinding(path, this.$bindings), this.$base);
        }

        return new URL([this.path, this.buildPathBinding(path, this.$bindings)].join('/'), this.$base);
    }

    /**
     * Parse given string path with regex to get
     * an array wif bindings information {required, value, name}
     *
     * @param {String} str
     * @param {RegExp} regex
     * @returns {Array}
     **/
    parse(str, regex) {

        const out = [];
        let m;

        if (!regex) {
            regex = new RegExp('{[w??:*]+}', 'gs');
        }

        while ((m = regex.exec(str)) !== null) {
            // This is necessary to avoid infinite loops with zero-width matches
            if (m.index === regex.lastIndex) {
                regex.lastIndex++;
            }

            // The result can be accessed through the `m`-variable.
            m.forEach((match) => {
                const placeholder = match.replace(/[{}]/gs, '');
                const parts = placeholder.split(':');
                const param = {
                    original: match,
                    name: parts.shift().replace(/\?$/, ''),
                    required: !/\?$/.test(placeholder),
                    value: parts.shift() || undefined,
                };

                if (this.has(param.name)) {

                    const index = this.$bindings.findIndex((i) => i.name === param.name);
                    this.$bindings[index].original = param.original;
                    this.$bindings[index].name = param.name;
                    this.$bindings[index].required = param.required;
                    this.$bindings[index].value = this.$bindings[index].value || param.value;

                } else {

                    out.push(param);
                }

            });
        }

        return out;
    }

    buildPathBinding(path, bindings) {
        return path.split('/')
            .map((part) => {
                const holder = bindings.find(({ original }) => original === part);
                if (!holder) {
                    return part;
                }
                return holder.value;
            })
            .filter((v) => v)
            .join('/');
    }

    get path() {
        return this.buildPathBinding(this.$path, this.$bindings);
    }

}
