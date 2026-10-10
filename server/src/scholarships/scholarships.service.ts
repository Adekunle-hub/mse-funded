import { Injectable, NotFoundException } from '@nestjs/common';

import { buildLandingSnapshot } from '../shared/data/landing-snapshot.js';
import { scholarshipSeed } from '../shared/data/scholarship-seed.js';
import { countListings, findListing, searchListings, similarListings } from '../shared/data/search.js';
import { defaultFilters, parseSearchFilters } from '../shared/scholarships/filters.js';
import type { ScholarshipDetail } from '../shared/types/scholarship.js';

type QueryInput = Record<string, string | string[] | undefined>;

@Injectable()
export class ScholarshipsService {
  search(query: QueryInput) {
    return searchListings(parseSearchFilters(query), new Date());
  }

  count(query: QueryInput) {
    return { total: countListings(parseSearchFilters(query), new Date()) };
  }

  findOne(id: string): ScholarshipDetail {
    const scholarship = findListing(id);
    if (!scholarship) throw new NotFoundException('Scholarship not found');
    return scholarship;
  }

  similar(id: string) {
    this.findOne(id);
    return similarListings(id, new Date());
  }

  prerenderIds() {
    return scholarshipSeed.map((scholarship) => scholarship.id);
  }

  landingSnapshot() {
    const now = new Date();
    const { items } = searchListings({ ...defaultFilters, page: 50 }, now);
    return buildLandingSnapshot(items, now);
  }
}
