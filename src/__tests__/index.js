'use strict';

import test from 'tape';
import postcss from 'postcss';
import filter from '../';
import fontWeight from 'postcss-minify-font-weight';
import pkg from '../../package.json';

let name = pkg.name;

function getCss (filters, cb) {
    return postcss(filters).process('h1{}').then(cb);
}

test('readme example code', t => {
    var counter = postcss.plugin('counter', function () {
        return function (css) {
            css.walkDecls('foo', function (decl) {
                let value = parseInt(decl.value, 10);
                value += 1;
                decl.value = String(value);
            });
        };
    });

    var css = 'h1 { foo: 1 }';
    var out = postcss([ filter(), counter(), counter() ]).process(css).css;

    t.plan(1);
    t.equal(out, 'h1 { foo: 2 }');
});

test('should handle processors without the postcssPlugin property', t => {
    var foo = function () {
        return function (css) {
            css.walkDecls('foo', function (foo) {
                foo.remove();
            });
        };
    };

    t.plan(2);

    var css = 'h1 { foo: bar; font-weight: normal }';

    postcss([ foo(), fontWeight(), filter(), foo(), fontWeight() ]).process(css).then(function (result) {
        t.equal(result.css, 'h1 { font-weight: 400 }');
        t.equal(result.processor.plugins.length, 4);
    });
});

test('should warn if plugin exists', t => {
    t.plan(2);
    let plugins = [ fontWeight(), filter(), fontWeight() ];
    getCss(plugins, result => {
        let warnings = result.warnings();
        t.equal(warnings.length, 1);
        t.equal(warnings[0].text, 'Found duplicate plugin: postcss-minify-font-weight');
    });
});

test('should warn if plugin exists, with a custom message', t => {
    let template = ({postcssPlugin}) => `Uh-oh: ${postcssPlugin}`;
    t.plan(2);
    let plugins = [ fontWeight(), filter({template: template}), fontWeight() ];
    getCss(plugins, result => {
        let warnings = result.warnings();
        t.equal(warnings.length, 1);
        t.equal(warnings[0].text, 'Uh-oh: postcss-minify-font-weight');
    });
});

test('should not warn when silent', t => {
    t.plan(1);
    let plugins = [ fontWeight(), filter({silent: true}), fontWeight() ];
    getCss(plugins, result => {
        let warnings = result.warnings();
        t.equal(warnings.length, 0);
    });
});

test('should not warn if the plugin is excluded from the filter', t => {
    t.plan(1);
    let plugins = [
        fontWeight(),
        filter({exclude: ['postcss-minify-font-weight']}),
        fontWeight()
    ];
    getCss(plugins, result => {
        let warnings = result.warnings();
        t.equal(warnings.length, 0);
    });
});

test('should operate forward from the filter instance', t => {
    t.plan(1);
    let plugins = [
        fontWeight(),
        filter({direction: 'forward'}),
        fontWeight(),
        fontWeight()
    ];
    getCss(plugins, result => {
        let warnings = result.warnings();
        t.equal(warnings.length, 1);
    });
});

test('should operate backward from the filter instance', t => {
    t.plan(1);
    let plugins = [
        fontWeight(),
        fontWeight(),
        filter({direction: 'backward'}),
        fontWeight()
    ];
    getCss(plugins, result => {
        let warnings = result.warnings();
        t.equal(warnings.length, 1);
    });
});

test('should not filter itself when there are multiple instances', t => {
    t.plan(1);
    let plugins = [ filter(), filter(), filter(), filter() ];
    getCss(plugins, result => {
        t.notOk(result.warnings().length);
    });
});

test('should use the postcss plugin api', function (t) {
    t.plan(2);
    t.ok(filter().postcssVersion, 'should be able to access version');
    t.equal(filter().postcssPlugin, name, 'should be able to access name');
});
