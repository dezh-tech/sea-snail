import { Injectable, Logger } from '@nestjs/common';
import { Request, Response } from 'express';
import { ApiConfigService } from '../../shared/services/api-config.service';
import { DomainsService } from '../domains/domains.service';
import { IdentifiersService } from '../identifiers/identifiers.service';
import { RecordsService } from '../records/records.service';
import { RecordTypeEnum } from '../records/enums/record-type.enum';
import { SimplePool, Filter, Event, nip19 } from 'nostr-tools';
import mime from 'mime-types';
import axios from 'axios';

/**
 * NsiteGatewayService encapsulates nsite host resolution logic.
 * It supports both <npub>.example.com and <name>.example.com where name is resolved via DB.
 */
@Injectable()
export class NsiteGatewayService {
  private readonly logger = new Logger(NsiteGatewayService.name);

  constructor(
    private readonly config: ApiConfigService,
    private readonly domains: DomainsService,
    private readonly identifiers: IdentifiersService,
    private readonly records: RecordsService,
  ) {}

  async handle(req: Request, res: Response, next: Function) {
    // CORS per BUD-01
    res.setHeader('Access-Control-Allow-Origin', '*');

    if (req.method === 'OPTIONS') {
      res.setHeader('Access-Control-Allow-Headers', 'Authorization, *');
      res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, PUT, DELETE');
      res.setHeader('Access-Control-Max-Age', '86400');
      res.status(204).end();
      return;
    }

    // Only handle GET and HEAD, pass through others
    if (!['GET', 'HEAD'].includes(req.method)) return next();

    const rawHost = (req.headers['x-forwarded-host'] as string) || req.headers.host || '';
    const hostname = (rawHost.split(':')[0] || '') as string;

    const [subdomain, ...rest] = hostname.split('.');
    if (!subdomain || rest.length < 2) return next(); // not a subdomain

    const path = this.normalizePath(req.path);

    // Resolve pubkey: try npub-encoded in subdomain, else try name lookup in DB
    let pubkey = this.tryDecodeNpub(subdomain);
    if (!pubkey) {
      pubkey = await this.resolvePubkeyByName(subdomain, rest.join('.'));
    }

    if (!pubkey) return next();

    try {
      // Get relays from user's 10002 list
      const relays = await this.getUserOutboxes(pubkey);
      if (relays.length === 0) return this.notFound(res, 'No relays found');

      const event = await this.getNsiteBlob(pubkey, path, relays);
      if (!event) {
        // fallback to /404.html
        const fallback = await this.getNsiteBlob(pubkey, '/404.html', relays);
        if (!fallback) return this.notFound(res, `Not Found: ${path}`);
        await this.streamFromBlossom(res, pubkey, fallback, relays);
        return;
      }

      await this.streamFromBlossom(res, pubkey, event, relays);
    } catch (e) {
      this.logger.error('Failed serving nsite', e as Error);
      return this.serverError(res, 'Failed to serve nsite');
    }
  }

  private normalizePath(p: string) {
    try {
      const url = new URL(p, 'http://x');
      let pathname = url.pathname;
      if (!/\.[a-z0-9]+$/i.test(pathname)) {
        // ensure ends with filename
        if (!pathname.endsWith('/')) pathname += '/';
        pathname += 'index.html';
      }
      return pathname;
    } catch {
      return '/index.html';
    }
  }

  private tryDecodeNpub(sub: string): string | null {
    try {
      const decoded = nip19.decode(sub);
      if (decoded.type === 'npub') return decoded.data as string;
      if (decoded.type === 'nprofile') return (decoded.data as any).pubkey as string;
      return null;
    } catch {
      return null;
    }
  }

  private async resolvePubkeyByName(name: string, domainRemainder: string): Promise<string | null> {
    // Check if the domainRemainder matches a configured domain in DB
    try {
      const domain = await this.domains.findOne({ where: { domain: domainRemainder } });
      const ident = await this.identifiers.findOne({ where: { name: name.toLowerCase(), domainId: domain._id.toString() } });
      // In Records, on IDENTIFIER_REGISTER, we store a NAMES record mapping key=name -> value=userId (which is pubkey)
      const rec = await this.records.findOne({ where: { identifierId: ident._id.toString(), type: RecordTypeEnum.NAMES, key: name.toLowerCase() } });
      const pubkey = (rec.value as string) ?? null;
      if (!pubkey) return null;
      return pubkey;
    } catch {
      return null;
    }
  }

  private async getUserOutboxes(pubkey: string): Promise<string[]> {
    const relays: string[] = [];
    const pool = new SimplePool();
    const timeoutMs = 4000;

    const filter: Filter = { kinds: [10002], authors: [pubkey] } as Filter;

    try {
      const events = await pool.querySync(this.config.nsiteConfig.subscriptionRelays, filter, { maxWait: timeoutMs } as any);
      for (const ev of events) {
        if (this.isKind(ev, 10002)) {
          for (const t of ev.tags) if (t[0] === 'r' && t[1]) relays.push(t[1]);
        }
      }
    } finally {
      pool.close(this.config.nsiteConfig.subscriptionRelays);
    }

    return Array.from(new Set(relays));
  }

  private async getNsiteBlob(pubkey: string, path: string, relays: string[]) {
    const pool = new SimplePool();
    const filter: Filter = { kinds: [34128], authors: [pubkey], '#d': [path] } as any;

    const evs = await pool.querySync(relays, filter, { maxWait: 4000 } as any);
    pool.close(relays);

    const ev = evs[0] as Event | undefined;
    if (!ev) return null as null | { sha256: string; path: string; created_at: number };

    const dTag = ev.tags.find((t) => t[0] === 'd')?.[1];
    const xTag = ev.tags.find((t) => t[0] === 'x')?.[1];
    if (!dTag || !xTag) return null;
    return { sha256: xTag, path: dTag, created_at: ev.created_at };
  }

  private async getUserBlossomServers(pubkey: string, relays: string[]) {
    const pool = new SimplePool();
    const filter: Filter = { kinds: [10063], authors: [pubkey] } as Filter;

    const evs = await pool.querySync(relays, filter, { maxWait: 4000 } as any);
    pool.close(relays);

    const servers: string[] = [];
    for (const ev of evs) {
      if (!this.isKind(ev as any, 10063)) continue;
      for (const t of (ev as any).tags) if (t[0] === 'server' && t[1]) servers.push(t[1]);
    }
    return Array.from(new Set(servers));
  }

  private async streamFromBlossom(res: Response, pubkey: string, event: { sha256: string; path: string; created_at: number }, relays: string[]) {
    // Per spec: if no 10063 user servers, return 404
    const servers = await this.getUserBlossomServers(pubkey, relays);
    if (servers.length === 0) return this.notFound(res, 'No user blossom servers');

    // always fetch from additional configured servers
    const allServers = Array.from(new Set([...servers, ...this.config.nsiteConfig.blossomServers]));

    // Try servers sequentially
    const range = (res.req.headers['range'] as string) || undefined;
    for (const base of allServers) {
      const url = new URL(event.sha256, base.endsWith('/') ? base : base + '/');
      const ext = (mime.extension(mime.lookup(event.path) || '') || 'bin') as string;
      url.pathname = '/' + event.sha256 + '.' + ext; // BUD-01 allows extension

      try {
        const resp = await axios.get(url.toString(), {
          responseType: 'stream',
          headers: range ? { Range: range } : undefined,
          validateStatus: () => true,
        });

        if (resp.status === 206) res.status(206);
        else if (resp.status >= 200 && resp.status < 300) res.status(200);
        else continue;

        // forward headers
        const type = mime.lookup(event.path) || resp.headers['content-type'] || 'application/octet-stream';
        res.setHeader('Content-Type', String(type));
        if (resp.headers['content-length']) res.setHeader('Content-Length', String(resp.headers['content-length']));
        if (resp.headers['accept-ranges']) res.setHeader('Accept-Ranges', String(resp.headers['accept-ranges']));
        if (resp.headers['content-range']) res.setHeader('Content-Range', String(resp.headers['content-range']));
        res.setHeader('ETag', resp.headers['etag'] || '"' + event.sha256 + '"');
        res.setHeader('Cache-Control', 'public, max-age=3600');
        res.setHeader('Last-Modified', new Date(event.created_at * 1000).toUTCString());

        resp.data.pipe(res);
        return;
      } catch (e) {
        this.logger.warn(`Blossom fetch failed from ${base}: ${(e as any)?.message || e}`);
      }
    }

    return this.badGateway(res, `Failed to fetch blob ${event.sha256}`);
  }

  private notFound(res: Response, msg: string) {
    res.status(404).send(msg);
  }

  private badGateway(res: Response, msg: string) {
    res.status(502).send(msg);
  }

  private serverError(res: Response, msg: string) {
    res.status(500).send(msg);
  }

  private isKind(e: Event, k: number) {
    return e.kind === k;
  }
}

