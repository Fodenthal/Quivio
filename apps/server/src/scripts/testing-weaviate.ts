import weaviate, { ApiKey } from 'weaviate-ts-client';
import { config } from 'dotenv';
config(); // so COHERE_API_KEY is loaded

const client = weaviate.client({
  scheme: 'https',
  host: 'cohere-demo.weaviate.network',
  apiKey: new ApiKey('0XzGpeyQwGdDmGQAx5UEXEddf8BRtlSoAY7wU5Gp'),        // ← use `apiKey`
  headers: { 'X-Cohere-Api-Key': process.env.COHERE_API_KEY! }         // third‑party key
});


(async () => {
    const ready = await client.misc.readyChecker().do();
    console.log('Weaviate ready:', ready);
  })();
  
