import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: 'https://dent-union.vercel.app',
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: 'https://dent-union.vercel.app/research',
      lastModified: new Date(),
      changeFrequency: 'always',
      priority: 0.8,
    },
  ];
}
