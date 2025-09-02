# Blog Directory Structure & Google Ads Integration

This directory contains all blog-related content for Quivio, including 18 comprehensive trivia articles across 20 categories.

## Directory Structure

```
blog/
├── layout.tsx                    # Blog-specific layout with Google Ads
├── page.tsx                     # Main blog index page
├── components/
│   └── BlogAd.tsx              # Reusable ad component
├── README.md                   # This file
└── [article-directories]/      # Individual blog articles
    └── page.tsx
```

## Google Ads Integration

### Why Ads are Only in the Blog Directory

- **Content-Rich Pages**: Ads perform better on pages with substantial content
- **User Experience**: Avoids ads on thin pages like homepage/game lobby
- **Revenue Optimization**: Better ad placement leads to higher revenue
- **Compliance**: Follows Google AdSense best practices

### Blog Layout (`layout.tsx`)

The blog layout includes:
- Google AdSense script loading (only for blog pages)
- Enhanced SEO metadata for blog content
- Proper OpenGraph and Twitter card tags
- Blog-specific meta descriptions and keywords

### Using the BlogAd Component

```tsx
import { BlogAd } from './components/BlogAd';

// Basic usage
<BlogAd slot="your-ad-slot-id" />

// With custom styling
<BlogAd 
  slot="your-ad-slot-id" 
  className="my-8 text-center"
  format="rectangle"
  responsive={true}
/>
```

### Ad Placement Best Practices

1. **After Introduction**: Place first ad after the opening paragraph
2. **Mid-Content**: Add ads between major sections (every 3-4 paragraphs)
3. **Before Conclusion**: Place ad before the final section
4. **Sidebar**: Use smaller format ads in sidebars (if applicable)

### Example Ad Placements

```tsx
export default function BlogArticle() {
  return (
    <article>
      <h1>Article Title</h1>
      <p>Introduction paragraph...</p>
      
      {/* First ad placement */}
      <BlogAd slot="1234567890" />
      
      <h2>Section 1</h2>
      <p>Content...</p>
      
      <h2>Section 2</h2>
      <p>Content...</p>
      
      {/* Mid-content ad */}
      <BlogAd slot="0987654321" format="rectangle" />
      
      <h2>Section 3</h2>
      <p>Content...</p>
      
      {/* Before conclusion */}
      <BlogAd slot="1122334455" />
      
      <h2>Conclusion</h2>
      <p>Concluding thoughts...</p>
    </article>
  );
}
```

## Content Categories (20 Total)

1. **History** - Ancient origins and historical context
2. **Skills** - Strategies for improvement
3. **Science** - Scientific discoveries and innovations  
4. **Psychology** - Mental aspects of competition
5. **Strategy** - Game theory and tactics
6. **Social** - Community and social benefits
7. **Media** - Entertainment and broadcasting
8. **Education** - Learning and teaching applications
9. **Hosting** - Event organization and management
10. **Sports** - Athletic trivia and stories
11. **Entertainment** - Pop culture and media
12. **Geography** - World knowledge and exploration
13. **Literature** - Books and literary history
14. **Technology** - Digital innovation and computing
15. **Music** - Musical history and culture
16. **Art** - Visual arts and creativity
17. **Food** - Culinary traditions and culture
18. **Nature** - Natural world and biodiversity
19. **Space** - Astronomy and space exploration
20. **Philosophy** - Great thinkers and ideas

## SEO Optimization

Each blog article includes:
- Proper heading hierarchy (H1, H2, H3)
- Meta descriptions and keywords
- Internal linking between related articles
- Structured content with clear sections
- Reading time estimates
- Publication dates
- Category classification

## Google Ads Approval Status

With 18 comprehensive articles (1000-1500 words each) across 20 categories, the blog meets and exceeds Google Ads approval requirements:

- ✅ **Content Volume**: 24+ substantial pages
- ✅ **Content Quality**: Educational, well-written articles
- ✅ **Content Diversity**: 20 different topic categories
- ✅ **SEO Optimization**: Proper structure and metadata
- ✅ **User Experience**: Professional design and navigation

## Future Enhancements

- Add more ad units to high-performing articles
- Implement ad performance tracking
- A/B test different ad placements
- Add related article recommendations
- Implement article search functionality
- Add social sharing buttons
