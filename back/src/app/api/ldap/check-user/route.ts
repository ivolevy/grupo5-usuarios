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
  const { searchParams } = new URL(request.url);
  const uid = searchParams.get('uid');

  if (!uid) {
    return NextResponse.json({
      success: false,
      error: 'UID parameter is required'
    }, { status: 400 });
  }

  const client = ldap.createClient({
    url: ldapConfig.url,
    timeout: 10000,
    connectTimeout: 10000,
    idleTimeout: 30000,
  });

  try {
    // Conectar como admin
    await new Promise<void>((resolve, reject) => {
      client.bind(ldapConfig.bindDN, ldapConfig.bindPassword, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    // Buscar el usuario específico
    const userDN = `uid=${uid},${ldapConfig.usersOU}`;
    const results = await new Promise<any[]>((resolve, reject) => {
      const results: any[] = [];
      
      client.search(userDN, {
        scope: 'base',
        attributes: ['*']
      }, (err, res) => {
        if (err) {
          reject(err);
          return;
        }

        res?.on('searchEntry', (entry) => {
          const attrs = entry.attributes;
          results.push({
            dn: entry.dn.toString(),
            uid: attrs.find(attr => attr.type === 'uid')?.values?.[0],
            cn: attrs.find(attr => attr.type === 'cn')?.values?.[0],
            sn: attrs.find(attr => attr.type === 'sn')?.values?.[0],
            givenName: attrs.find(attr => attr.type === 'givenName')?.values?.[0],
            mail: attrs.find(attr => attr.type === 'mail')?.values?.[0],
            objectClass: attrs.find(attr => attr.type === 'objectClass')?.values || [],
            userPassword: attrs.find(attr => attr.type === 'userPassword')?.values?.[0] ? '***HIDDEN***' : 'NOT SET',
            hasPassword: !!attrs.find(attr => attr.type === 'userPassword')?.values?.[0]
          });
        });

        res?.on('error', reject);
        res?.on('end', () => resolve(results));
      });
    });

    if (results.length === 0) {
      return NextResponse.json({
        success: false,
        error: `User ${uid} not found`
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: results[0]
    });

  } catch (error) {
    console.error('Check user error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  } finally {
    client.unbind(() => {});
  }
}

