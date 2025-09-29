import { NextRequest, NextResponse } from 'next/server';
import * as ldap from 'ldapjs';

const ldapConfig = {
  url: 'ldap://35.184.48.90:389',
  baseDN: 'dc=empresa,dc=local',
  bindDN: 'cn=admin,dc=empresa,dc=local',
  bindPassword: 'boca2002',
  usersOU: 'ou=users,dc=empresa,dc=local'
};

export async function GET(request: NextRequest) {
  const client = ldap.createClient({
    url: ldapConfig.url,
    timeout: 10000,
    connectTimeout: 10000,
    idleTimeout: 30000,
  });

  try {
    // Conectar
    await new Promise<void>((resolve, reject) => {
      client.bind(ldapConfig.bindDN, ldapConfig.bindPassword, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    // Buscar en el Base DN
    const baseResults = await new Promise<any[]>((resolve, reject) => {
      const results: any[] = [];
      
      client.search(ldapConfig.baseDN, {
        scope: 'sub',
        filter: '(objectClass=*)',
        attributes: ['*']
      }, (err, res) => {
        if (err) {
          reject(err);
          return;
        }

        res?.on('searchEntry', (entry) => {
          results.push({
            dn: entry.dn.toString(),
            objectClasses: entry.attributes.find(attr => attr.type === 'objectClass')?.values || [],
            ou: entry.attributes.find(attr => attr.type === 'ou')?.values?.[0],
            dc: entry.attributes.find(attr => attr.type === 'dc')?.values?.[0],
            cn: entry.attributes.find(attr => attr.type === 'cn')?.values?.[0]
          });
        });

        res?.on('error', reject);
        res?.on('end', () => resolve(results));
      });
    });

    // Buscar específicamente en la OU de usuarios
    let usersResults: any[] = [];
    try {
      usersResults = await new Promise<any[]>((resolve, reject) => {
        const results: any[] = [];
        
        client.search(ldapConfig.usersOU, {
          scope: 'sub',
          filter: '(objectClass=*)',
          attributes: ['*']
        }, (err, res) => {
          if (err) {
            resolve([]); // Si no existe, retornar array vacío
            return;
          }

          res?.on('searchEntry', (entry) => {
            results.push({
              dn: entry.dn.toString(),
              objectClasses: entry.attributes.find(attr => attr.type === 'objectClass')?.values || [],
              uid: entry.attributes.find(attr => attr.type === 'uid')?.values?.[0],
              cn: entry.attributes.find(attr => attr.type === 'cn')?.values?.[0],
              mail: entry.attributes.find(attr => attr.type === 'mail')?.values?.[0]
            });
          });

          res?.on('error', () => resolve([]));
          res?.on('end', () => resolve(results));
        });
      });
    } catch (error) {
      usersResults = [];
    }

    return NextResponse.json({
      success: true,
      data: {
        baseDN: ldapConfig.baseDN,
        usersOU: ldapConfig.usersOU,
        baseStructures: baseResults,
        usersInOU: usersResults,
        totalBaseObjects: baseResults.length,
        totalUsers: usersResults.length
      }
    });

  } catch (error) {
    console.error('Debug LDAP Error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      data: {
        baseDN: ldapConfig.baseDN,
        usersOU: ldapConfig.usersOU
      }
    }, { status: 500 });
  } finally {
    client.unbind(() => {});
  }
}

