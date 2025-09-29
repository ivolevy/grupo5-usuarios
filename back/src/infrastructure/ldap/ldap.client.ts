import * as ldap from 'ldapjs';
import { LDAPConfig } from '../../types/ldap.types';

export class LDAPClient {
  private client: ldap.Client;
  private config: LDAPConfig;

  constructor(config: LDAPConfig) {
    this.config = config;
    this.client = ldap.createClient({
      url: config.url,
      timeout: 30000,        // 30 segundos
      connectTimeout: 30000, // 30 segundos
      idleTimeout: 60000,    // 60 segundos
    });

    this.setupErrorHandling();
  }

  private setupErrorHandling(): void {
    this.client.on('error', (err) => {
      console.error('LDAP Client Error:', err);
    });

    this.client.on('connect', () => {
      console.log('LDAP Client connected successfully');
    });

    this.client.on('connectTimeout', () => {
      console.error('LDAP Connection timeout');
    });

    this.client.on('connectError', (err) => {
      console.error('LDAP Connection error:', err);
    });
  }

  async bind(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.client.bind(this.config.bindDN, this.config.bindPassword, (err) => {
        if (err) {
          console.error('LDAP Bind failed:', err);
          reject(new Error(`LDAP Bind failed: ${err.message}`));
        } else {
          console.log('LDAP Bind successful');
          resolve();
        }
      });
    });
  }

  async unbind(): Promise<void> {
    return new Promise((resolve) => {
      this.client.unbind(() => {
        console.log('LDAP Client disconnected');
        resolve();
      });
    });
  }

  async search(baseDN: string, options: ldap.SearchOptions): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const results: any[] = [];

      this.client.search(baseDN, options, (err, res) => {
        if (err) {
          reject(new Error(`LDAP Search failed: ${err.message}`));
          return;
        }

        res.on('searchEntry', (entry) => {
          results.push({
            dn: entry.dn.toString(),
            attributes: entry.attributes
          });
        });

        res.on('error', (err) => {
          reject(new Error(`LDAP Search error: ${err.message}`));
        });

        res.on('end', (result) => {
          if (result?.status !== 0) {
            reject(new Error(`LDAP Search ended with status: ${result?.status}`));
          } else {
            resolve(results);
          }
        });
      });
    });
  }

  async add(dn: string, attributes: any): Promise<void> {
    return new Promise((resolve, reject) => {
      this.client.add(dn, attributes, (err) => {
        if (err) {
          reject(new Error(`LDAP Add failed: ${err.message}`));
        } else {
          resolve();
        }
      });
    });
  }

  async modify(dn: string, changes: ldap.Change[]): Promise<void> {
    return new Promise((resolve, reject) => {
      this.client.modify(dn, changes, (err) => {
        if (err) {
          reject(new Error(`LDAP Modify failed: ${err.message}`));
        } else {
          resolve();
        }
      });
    });
  }

  async delete(dn: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.client.del(dn, (err) => {
        if (err) {
          reject(new Error(`LDAP Delete failed: ${err.message}`));
        } else {
          resolve();
        }
      });
    });
  }

  getClient(): ldap.Client {
    return this.client;
  }
}

