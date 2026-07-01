import { vi } from 'vitest';
import { JSDOM } from 'jsdom';
import fs from 'fs';
import path from 'path';

const html = fs.readFileSync(path.resolve('index.html'), 'utf-8');
const dom = new JSDOM(html, {
  url: 'https://devcheap-3uq.pages.dev/',
  runScripts: 'outside-only',
});

global.document = dom.window.document;
global.window = dom.window;
global.navigator = dom.window.navigator;
global.localStorage = dom.window.localStorage;

dom.window.requestAnimationFrame = (cb) => setTimeout(cb, 16);
global.requestAnimationFrame = dom.window.requestAnimationFrame;

const searchJs = fs.readFileSync(path.resolve('js/search.js'), 'utf-8');
dom.window.eval(searchJs);

globalThis.document = dom.window.document;
globalThis.window = dom.window;
globalThis.navigator = dom.window.navigator;
globalThis.localStorage = dom.window.localStorage;
globalThis.vi = vi;