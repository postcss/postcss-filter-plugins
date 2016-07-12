import test from 'ava';
import postcss from 'postcss';
import {name} from '../../package.json';
import filter from '../';

function getWarnings (filters) {
    return postcss(filters).process('h1{}').warnings();
}

const fontWeight = postcss.plugin('fontWeight', () => {
    return function (css) {
        css.walkDecls('font-weight', decl => {
            const {value} = decl;
            decl.value = value === 'normal' ? '400' : value === 'bold' ? '700' : value;
        });
    };
});

test('readme example code', t => {
    const counter = postcss.plugin('counter', () => {
        return css => {
            css.walkDecls('foo', decl => {
                let value = parseInt(decl.value, 10);
                value += 1;
                decl.value = String(value);
            });
        };
    });

    const css = 'h1 { foo: 1 }';
    const out = postcss([ filter(), counter(), counter() ]).process(css).css;
    t.is(out, 'h1 { foo: 2 }');
});

test('should handle processors without the postcssPlugin property', t => {
    const foo = () => css => css.walkDecls('foo', f => f.remove());
    const css = 'h1 { foo: bar; font-weight: normal }';

    return postcss([ foo(), fontWeight(), filter(), foo(), fontWeight() ]).process(css).then(result => {
        t.is(result.css, 'h1 { font-weight: 400 }');
        t.is(result.processor.plugins.length, 4);
    });
});

test('should warn if plugin exists', t => {
    const plugins = [
        fontWeight(),
        filter(),
        fontWeight(),
    ];
    const warnings = getWarnings(plugins);
    t.is(warnings.length, 1);
    t.is(warnings[0].text, 'Found duplicate plugin: fontWeight');
});

test('should warn if plugin exists, with a custom message', t => {
    const template = ({postcssPlugin}) => `Uh-oh: ${postcssPlugin}`;
    const plugins = [
        fontWeight(),
        filter({template}),
        fontWeight(),
    ];
    const warnings = getWarnings(plugins);
    t.is(warnings.length, 1);
    t.is(warnings[0].text, 'Uh-oh: fontWeight');
});

test('should not warn when silent', t => {
    const plugins = [
        fontWeight(),
        filter({silent: true}),
        fontWeight(),
    ];
    t.is(getWarnings(plugins).length, 0);
});

test('should not warn if the plugin is excluded from the filter', t => {
    const plugins = [
        fontWeight(),
        filter({exclude: ['fontWeight']}),
        fontWeight(),
    ];
    t.is(getWarnings(plugins).length, 0);
});

test('should operate forward from the filter instance', t => {
    const plugins = [
        fontWeight(),
        filter({direction: 'forward'}),
        fontWeight(),
        fontWeight(),
    ];
    t.is(getWarnings(plugins).length, 1);
});

test('should operate backward from the filter instance', t => {
    const plugins = [
        fontWeight(),
        fontWeight(),
        filter({direction: 'backward'}),
        fontWeight(),
    ];
    t.is(getWarnings(plugins).length, 1);
});

test('should not filter itself when there are multiple instances', t => {
    const plugins = [ filter(), filter(), filter(), filter() ];
    t.falsy(getWarnings(plugins).length);
});

test('should use the postcss plugin api', t => {
    t.truthy(filter().postcssVersion, 'should be able to access version');
    t.deepEqual(filter().postcssPlugin, name, 'should be able to access name');
});
