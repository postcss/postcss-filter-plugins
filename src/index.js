'use strict';

import postcss from 'postcss';
import uniqid from 'uniqid';

export default postcss.plugin('postcss-filter-plugins', ({
    template = ({postcssPlugin}) => `Found duplicate plugin: ${postcssPlugin}`,
    silent = false,
    exclude = [],
    direction = 'both'
} = {}) => {
    let id = uniqid();
    let prev, next, both;

    switch (direction) {
        case 'both':
            both = true;
            break;
        case 'backward':
            prev = true;
            break;
        case 'forward':
            next = true;
            break;
    }

    let plugin = (css, result) => {
        let previousPlugins = [];
        let nextPlugins = [];
        let bothPlugins = [];
        let filter = false;
        let position = 0;

        let detect = (list, plugin) => {
            let name = plugin.postcssPlugin;
            if (~list.indexOf(name)) {
                if (!silent) {
                    result.warn(template(plugin));
                }
                result.processor.plugins.splice(position, 1);
            } else {
                list.push(name);
                position ++;
            }
        };

        while (position < result.processor.plugins.length) {
            let plugin = result.processor.plugins[position];
            if (~exclude.indexOf(plugin.postcssPlugin)) {
                position ++;
                continue;
            }
            if (plugin._id === id) {
                position ++;
                filter = true;
                continue;
            } else if (plugin.postcssPlugin === 'postcss-filter-plugins') {
                position ++;
                continue;
            }
            if (both) {
                detect(bothPlugins, plugin);
                continue;
            }
            if (filter && next) {
                detect(nextPlugins, plugin);
                continue;
            }
            if (!filter && prev) {
                detect(previousPlugins, plugin);
                continue;
            }
            position ++;
        }
    };

    plugin._id = id;

    return plugin;
});
