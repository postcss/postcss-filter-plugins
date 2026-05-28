'use strict';

const postcss = require('postcss');

const PLUGIN_NAME = 'postcss-filter-plugins';
const POSTCSS_VERSION = new postcss.Processor().version;

const create = (opts = {}) => {
    const {
        template = ({postcssPlugin}) => `Found duplicate plugin: ${postcssPlugin}`,
        silent = false,
        exclude = [],
        direction = 'both',
    } = opts;

    const id = Math.random().toString();

    return {
        postcssPlugin: PLUGIN_NAME,
        postcssVersion: POSTCSS_VERSION,
        _id: id,
        prepare(result) {
            const plugins = result.processor.plugins;

            let selfIndex = -1;
            for (let i = 0; i < plugins.length; i++) {
                if (plugins[i]._id === id) {
                    selfIndex = i;
                    break;
                }
            }

            const seenBefore = [];
            const seenAfter = [];
            const seenBoth = [];
            const toRemove = [];

            for (let i = 0; i < plugins.length; i++) {
                if (i === selfIndex) continue;
                const plugin = plugins[i];
                const name = plugin.postcssPlugin;
                if (typeof name === 'undefined') continue;
                if (name === PLUGIN_NAME) continue;
                if (exclude.indexOf(name) !== -1) continue;

                let list;
                if (direction === 'both') {
                    list = seenBoth;
                } else if (direction === 'forward') {
                    if (i < selfIndex) continue;
                    list = seenAfter;
                } else if (direction === 'backward') {
                    if (i > selfIndex) continue;
                    list = seenBefore;
                } else {
                    continue;
                }

                if (list.indexOf(name) !== -1) {
                    if (!silent) result.warn(template(plugin));
                    toRemove.push(i);
                } else {
                    list.push(name);
                }
            }

            for (let i = toRemove.length - 1; i >= 0; i--) {
                plugins.splice(toRemove[i], 1);
            }

            return {};
        },
    };
};

create.postcss = true;

module.exports = create;
