import { Client } from '@elastic/elasticsearch';

export const esClient = new Client({
  node: process.env.ELASTICSEARCH_URL || 'https://localhost:9200',
  auth: {
    username: 'elastic',
    password: 'NWZVgF9*6g_OsqiNlGy7', // Get this from your Docker logs (look for "password for the elastic user")
  },
  tls: {
    rejectUnauthorized: false, // For local dev only
  },
});