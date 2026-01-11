// Netlify Function to fetch WoW Guild Roster from Blizzard API
const https = require('https');

// Helper to make HTTPS requests
function httpsRequest(url, options = {}) {
    return new Promise((resolve, reject) => {
          const req = https.request(url, options, (res) => {
                  let data = '';
                  res.on('data', chunk => data += chunk);
                  res.on('end', () => {
                            try {
                                        resolve({ status: res.statusCode, data: JSON.parse(data) });
                            } catch (e) {
                                        resolve({ status: res.statusCode, data: data });
                            }
                  });
          });
          req.on('error', reject);
          if (options.body) req.write(options.body);
          req.end();
    });
}

// Get OAuth token from Blizzard
async function getAccessToken() {
    const clientId = process.env.BLIZZARD_CLIENT_ID;
    const clientSecret = process.env.BLIZZARD_CLIENT_SECRET;
    const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  const response = await httpsRequest('https://oauth.battle.net/token', {
        method: 'POST',
        headers: {
                'Authorization': `Basic ${auth}`,
                'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: 'grant_type=client_credentials'
  });

  return response.data.access_token;
}

// Fetch guild roster
async function getGuildRoster(region, realm, guild, token) {
    const realmSlug = realm.toLowerCase().replace(/\s+/g, '-');
    const guildSlug = guild.toLowerCase().replace(/\s+/g, '-');
    const url = `https://${region}.api.blizzard.com/data/wow/guild/${realmSlug}/${guildSlug}/roster?namespace=profile-${region}&locale=en_US&access_token=${token}`;

  return await httpsRequest(url);
}

exports.handler = async (event) => {
    const headers = {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Content-Type': 'application/json'
    };

    if (event.httpMethod === 'OPTIONS') {
          return { statusCode: 200, headers, body: '' };
    }

    try {
          const params = event.queryStringParameters || {};
          const region = params.region || 'us';
          const realm = params.realm;
          const guild = params.guild;

      if (!realm || !guild) {
              return {
                        statusCode: 400,
                        headers,
                        body: JSON.stringify({ error: 'Missing realm or guild parameter' })
              };
      }

      const token = await getAccessToken();
          const roster = await getGuildRoster(region, realm, guild, token);

      return {
              statusCode: roster.status,
              headers,
              body: JSON.stringify(roster.data)
      };
    } catch (error) {
          return {
                  statusCode: 500,
                  headers,
                  body: JSON.stringify({ error: error.message })
          };
    }
};
