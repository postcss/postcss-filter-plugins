'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const postcss = require('postcss');
const {name} = require('../../package.json');
const filter = require('../');

function getWarnings (filters) {
    return postcss(filters).process('h1{}', {from: undefined}).warnings();
}

const fontWeight = () => ({
    postcssPlugin: 'fontWeight',
    Once(css) {
        css.walkDecls('font-weight', decl => {
            const {value} = decl;
            decl.value = value === 'normal' ? '400' : value === 'bold' ? '700' : value;
        });
    },
});
fontWeight.postcss = true;

test('readme example code', () => {
    const counter = () => ({
        postcssPlugin: 'counter',
        Once(css) {
            css.walkDecls('foo', decl => {
                let value = parseInt(decl.value, 10);
                value += 1;
                decl.value = String(value);
            });
        },
    });
    counter.postcss = true;

    const css = 'h1 { foo: 1 }';
    const out = postcss([ filter(), counter(), counter() ]).process(css, {from: undefined}).css;
    assert.equal(out, 'h1 { foo: 2 }');
});

test('should handle processors without the postcssPlugin property', () => {
    const foo = () => css => css.walkDecls('foo', f => f.remove());
    const css = 'h1 { foo: bar; font-weight: normal }';

    return postcss([ foo(), fontWeight(), filter(), foo(), fontWeight() ]).process(css, {from: undefined}).then(result => {
        assert.equal(result.css, 'h1 { font-weight: 400 }');
        assert.equal(result.processor.plugins.length, 4);
    });
});

test('should warn if plugin exists', () => {
    const plugins = [
        fontWeight(),
        filter(),
        fontWeight(),
    ];
    const warnings = getWarnings(plugins);
    assert.equal(warnings.length, 1);
    assert.equal(warnings[0].text, 'Found duplicate plugin: fontWeight');
});

test('should warn if plugin exists, with a custom message', () => {
    const template = ({postcssPlugin}) => `Uh-oh: ${postcssPlugin}`;
    const plugins = [
        fontWeight(),
        filter({template}),
        fontWeight(),
    ];
    const warnings = getWarnings(plugins);
    assert.equal(warnings.length, 1);
    assert.equal(warnings[0].text, 'Uh-oh: fontWeight');
});

test('should not warn when silent', () => {
    const plugins = [
        fontWeight(),
        filter({silent: true}),
        fontWeight(),
    ];
    assert.equal(getWarnings(plugins).length, 0);
});

test('should not warn if the plugin is excluded from the filter', () => {
    const plugins = [
        fontWeight(),
        filter({exclude: ['fontWeight']}),
        fontWeight(),
    ];
    assert.equal(getWarnings(plugins).length, 0);
});

test('should operate forward from the filter instance', () => {
    const plugins = [
        fontWeight(),
        filter({direction: 'forward'}),
        fontWeight(),
        fontWeight(),
    ];
    assert.equal(getWarnings(plugins).length, 1);
});

test('should operate backward from the filter instance', () => {
    const plugins = [
        fontWeight(),
        fontWeight(),
        filter({direction: 'backward'}),
        fontWeight(),
    ];
    assert.equal(getWarnings(plugins).length, 1);
});

test('should not filter itself when there are multiple instances', () => {
    const plugins = [ filter(), filter(), filter(), filter() ];
    assert.ok(!getWarnings(plugins).length);
});

test('should use the postcss plugin api', () => {
    assert.ok(filter().postcssVersion, 'should be able to access version');
    assert.deepEqual(filter().postcssPlugin, name, 'should be able to access name');
});
