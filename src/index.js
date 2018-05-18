import postcss from 'postcss';

export default postcss.plugin('postcss-filter-plugins', ({
    template = ({postcssPlugin}) => `Found duplicate plugin: ${postcssPlugin}`,
    silent = false,
    exclude = [],
    direction = 'both',
} = {}) => {
    const id = Math.random().toString();
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

    const processor = (css, result) => {
        const previousPlugins = [];
        const nextPlugins = [];
        const bothPlugins = [];
        let filter = false;
        let position = 0;

        const detect = (list, plugin) => {
            const name = plugin.postcssPlugin;
            if (typeof name === 'undefined') {
                position++;
                return;
            }
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
            const plugin = result.processor.plugins[position];
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

    processor._id = id;

    return processor;
});
