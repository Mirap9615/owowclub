export const EVENT_TYPES = [
    { value: 'travel', label: 'Travel Adventure' },
    { value: 'tea-party', label: 'Tea Party' },
    { value: 'golf', label: 'Golf Practice' },
    { value: 'concert', label: 'Concert or Live Show' },
    { value: 'arts-crafts', label: 'Arts & Crafts Workshop' },
    { value: 'entertainment', label: 'General Entertainment' },
    { value: 'cooking-food', label: 'Cooking, Baking, or Food Tasting' },
    { value: 'sports', label: 'Sports or Physical Activity' },
    { value: 'hiking-camping', label: 'Hiking or Camping Trip' },
    { value: 'book-club', label: 'Book Club Meeting' },
    { value: 'yoga-meditation', label: 'Yoga or Meditation Session' },
    { value: 'picnic', label: 'Picnic or Outdoor Gathering' },
    { value: 'movie-screening', label: 'Movie Screening' },
    { value: 'charity-fundraising', label: 'Charity or Fundraising Event' },
    { value: 'arcade-escape', label: 'Arcade or Escape Room' },
    { value: 'wine-tasting', label: 'Wine or Craft Beer Tasting' },
    { value: 'karaoke', label: 'Karaoke Night' },
    { value: 'volunteer-day', label: 'Community Volunteer Day' },
    { value: 'fishing-trip', label: 'Fishing Trip' },
    { value: 'golfing', label: 'Golfing Outing' },
    { value: 'potluck', label: 'Potluck Gathering' },
    { value: 'art-gallery', label: 'Art Gallery Tour' },
    { value: 'museum', label: 'Museum Visit' },
    { value: 'other', label: 'Other' },
    { value: 'custom', label: 'Custom...' },
];

export const EVENT_TYPE_MAP = EVENT_TYPES.reduce((acc, type) => {
    acc[type.value] = type.label;
    return acc;
}, {});
