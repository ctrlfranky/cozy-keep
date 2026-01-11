// Netlify Blob storage for persistent data sync
const { getStore } = require("@netlify/blobs");

exports.handler = async (event, context) => {
      const headers = {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Content-Type': 'application/json'
      };

      // Handle preflight
      if (event.httpMethod === 'OPTIONS') {
                return { statusCode: 200, headers, body: '' };
      }

      try {
                const store = getStore("cozy-keep-data");
                const key = "guild-housing-data";

          if (event.httpMethod === 'GET') {
                        // Load data
                    const data = await store.get(key, { type: 'json' });
                        if (data) {
                                          return { statusCode: 200, headers, body: JSON.stringify(data) };
                        }
                        // Return default data if none exists
                    const defaultData = {
                                      alliance: { subdivisions: [{ id: 1, name: 'Stormwind Heights', plots: 55 }], plots: {} },
                                      horde: { subdivisions: [{ id: 1, name: 'Orgrimmar Plaza', plots: 55 }], plots: {} }
                    };
                        return { statusCode: 200, headers, body: JSON.stringify(defaultData) };
          }

          if (event.httpMethod === 'POST') {
                        // Save data
                    const body = JSON.parse(event.body);
                        if (body.action === 'save' && body.data) {
                                          await store.setJSON(key, body.data);
                                          return { statusCode: 200, headers, body: JSON.stringify({ success: true }) };
                        }
                        return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid request' }) };
          }

          return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
      } catch (error) {
                console.error('Error:', error);
                return { statusCode: 500, headers, body: JSON.stringify({ error: error.message }) };
      }
};
