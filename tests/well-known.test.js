import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

const ROOT = path.resolve('.');

describe('well-known files', () => {
  it('robots.txt allows AI bots', () => {
    const content = fs.readFileSync(path.join(ROOT, 'robots.txt'), 'utf-8');
    expect(content).toContain('User-agent: GPTBot');
    expect(content).toContain('Allow');
    expect(content).toContain('User-agent: Claude-Web');
    expect(content).toContain('User-agent: CCBot');
    expect(content).toContain('User-agent: Google-Extended');
    expect(content).toContain('Sitemap:');
  });

  it('robots.txt does not block general crawlers', () => {
    const content = fs.readFileSync(path.join(ROOT, 'robots.txt'), 'utf-8');
    const blocks = content.match(/User-agent:\s*\*\s*\nDisallow:/);
    expect(blocks).toBeNull();
  });

  it('MCP server card exists and is valid JSON', () => {
    const p = path.join(ROOT, '.well-known', 'mcp', 'server-card.json');
    expect(fs.existsSync(p)).toBe(true);
    const card = JSON.parse(fs.readFileSync(p, 'utf-8'));
    expect(card.server).toBeDefined();
    expect(card.server.name).toBe('DevCheap Deals API');
    expect(card.capabilities).toBeDefined();
    expect(card.resources).toBeInstanceOf(Array);
    expect(card.tools).toBeInstanceOf(Array);
    expect(card.prompts).toBeInstanceOf(Array);
  });

  it('agent-skills index exists and lists skills', () => {
    const p = path.join(ROOT, '.well-known', 'agent-skills', 'index.json');
    expect(fs.existsSync(p)).toBe(true);
    const idx = JSON.parse(fs.readFileSync(p, 'utf-8'));
    expect(idx.skills).toBeInstanceOf(Array);
    expect(idx.skills.length).toBeGreaterThanOrEqual(5);
  });

  it('api-catalog exists', () => {
    const p = path.join(ROOT, '.well-known', 'api-catalog');
    expect(fs.existsSync(p)).toBe(true);
    const catalog = JSON.parse(fs.readFileSync(p, 'utf-8'));
    expect(catalog.endpoints).toBeInstanceOf(Array);
  });

  it('OAuth resource descriptors exist', () => {
    const authServerPath = path.join(ROOT, '.well-known', 'oauth-authorization-server');
    const resourcePath = path.join(ROOT, '.well-known', 'oauth-protected-resource');
    expect(fs.existsSync(authServerPath)).toBe(true);
    expect(fs.existsSync(resourcePath)).toBe(true);
  });
});
