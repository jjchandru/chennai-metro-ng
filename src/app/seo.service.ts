import { Injectable } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';

@Injectable({
  providedIn: 'root'
})
export class SeoService {
  
  constructor(
    private meta: Meta, 
    private title: Title
  ) {}

  setDefaultSEO() {
    this.title.setTitle('MetroVazhi - Chennai Metro Route Planner');
    
    this.meta.updateTag({ 
      name: 'description', 
      content: 'Find the best Chennai Metro routes instantly. Plan your journey between any stations with step-by-step directions in English and Tamil.' 
    });
    
    this.meta.updateTag({ 
      name: 'keywords', 
      content: 'Chennai Metro, route planner, metro directions, CMRL, Chennai transport, MetroVazhi, சென்னை மெட்ரோ' 
    });
    
    // Open Graph tags
    this.meta.updateTag({ 
      property: 'og:title', 
      content: 'MetroVazhi - Chennai Metro Route Planner' 
    });
    
    this.meta.updateTag({ 
      property: 'og:description', 
      content: 'Find the best metro routes in Chennai Metro Rail network with our easy-to-use route planner' 
    });
    
    this.meta.updateTag({ 
      property: 'og:type', 
      content: 'website' 
    });
    
    this.meta.updateTag({ 
      property: 'og:url', 
      content: 'https://jjchandru.github.io/chennai-metro-ng/' 
    });
  }

  updateForRoute(from: string, to: string) {
    const routeTitle = `${from} to ${to} - Chennai Metro Route | MetroVazhi`;
    const description = `Find Chennai Metro route from ${from} to ${to}. Get detailed directions and transit information with MetroVazhi.`;
    
    this.title.setTitle(routeTitle);
    this.meta.updateTag({ name: 'description', content: description });
    this.meta.updateTag({ property: 'og:title', content: routeTitle });
    this.meta.updateTag({ property: 'og:description', content: description });
    
    this.addStructuredData(from, to);
  }

  private addStructuredData(from: string, to: string) {
    // Remove existing structured data
    const existingScript = document.getElementById('journey-structured-data');
    if (existingScript) {
      existingScript.remove();
    }

    const structuredData = {
      "@context": "https://schema.org",
      "@type": "TripAction",
      "name": `Chennai Metro Route: ${from} to ${to}`,
      "description": `Metro route planning from ${from} to ${to} in Chennai Metro Rail network`,
      "fromLocation": {
        "@type": "Place",
        "name": from,
        "addressLocality": "Chennai",
        "addressRegion": "Tamil Nadu",
        "addressCountry": "IN"
      },
      "toLocation": {
        "@type": "Place", 
        "name": to,
        "addressLocality": "Chennai",
        "addressRegion": "Tamil Nadu",
        "addressCountry": "IN"
      },
      "provider": {
        "@type": "Organization",
        "name": "MetroVazhi",
        "url": "https://jjchandru.github.io/chennai-metro-ng/"
      }
    };

    const script = document.createElement('script');
    script.id = 'journey-structured-data';
    script.type = 'application/ld+json';
    script.text = JSON.stringify(structuredData);
    document.head.appendChild(script);
  }
}