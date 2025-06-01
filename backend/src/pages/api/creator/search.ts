import type { NextApiRequest, NextApiResponse } from 'next';
import { esClient } from '../../../lib/elasticsearch';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { prompt } = req.query;

  if (!prompt || typeof prompt !== 'string') {
    return res.status(400).json({ error: 'Prompt is required' });
  }

  try {
    // Only use Elasticsearch results!
    const esResult = await esClient.search({
      index: 'creators',
      query: {
        multi_match: {
          query: prompt,
          fields: ['bio', 'categories'],
        },
      },
      size: 10,
    });
    const creators = esResult.hits.hits.map((hit: any) => hit._source);

    res.status(200).json({
      creators,
      gpt_summary: "Summary here", // Replace with actual summary if needed
    });
  } catch (error) {
    res.status(500).json({ error: 'Elasticsearch query failed', details: error });
  }
}