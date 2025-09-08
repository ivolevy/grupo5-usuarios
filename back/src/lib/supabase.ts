// Configuración de Supabase para el proyecto grupousuarios-tp
export const supabaseConfig = {
  url: 'https://smvsrzphpcuukrnocied.supabase.co',
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNtdnNyenBocGN1dWtybm9jaWVkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcwNzg3NjksImV4cCI6MjA3MjY1NDc2OX0.XHDYW_huSTzr_wfhtDG8Y14FI67Mi5DkjIlFlPyKl_8',
  databaseUrl: 'postgresql://postgres:grupousuarios_tp@db.smvsrzphpcuukrnocied.supabase.co:5432/postgres'
};

// Función helper para hacer requests a la API de Supabase
export async function supabaseRequest(endpoint: string, options: RequestInit = {}) {
  const url = `${supabaseConfig.url}/rest/v1/${endpoint}`;
  
  const defaultHeaders = {
    'apikey': supabaseConfig.anonKey,
    'Authorization': `Bearer ${supabaseConfig.anonKey}`,
    'Content-Type': 'application/json'
  };

  const response = await fetch(url, {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers
    }
  });

  if (!response.ok) {
    throw new Error(`Supabase request failed: ${response.status} ${response.statusText}`);
  }

  return response;
}
