export interface GuideSection {
  heading: string;
  content: string | string[];
}

export interface GuideFaq {
  q: string;
  a: string;
}

export interface Guide {
  slug: string;
  title: string;
  description: string;
  category: string;
  publishedDate: string;
  readingMinutes: number;
  heroTag: string;
  intro: string;
  sections: GuideSection[];
  faqs?: GuideFaq[];
  ctaHref: string;
  ctaLabel: string;
  relatedSlugs?: string[];
}

export const GUIDES: Guide[] = [
  {
    slug: "how-much-does-a-dj-cost-in-essex",
    title: "How Much Does a DJ Cost in Essex?",
    description:
      "A guide to DJ pricing in Essex: covering typical rates, what affects the price, and how to find a reliable DJ for your event.",
    category: "Entertainment",
    publishedDate: "2026-06-01",
    readingMinutes: 6,
    heroTag: "DJ Pricing Guide",
    intro:
      "DJ costs in Essex vary significantly depending on the type of event, the DJ's experience, how long they play, and what equipment is included. This guide breaks down typical prices so you know what to expect before you enquire.",
    sections: [
      {
        heading: "Typical DJ prices in Essex (2025–2026)",
        content: [
          "Private parties and birthdays: £200–£500 for a 4-hour set",
          "Wedding receptions: £600–£1,500 depending on hours, equipment, and experience",
          "Corporate events: £500–£1,200 for a professional MC and DJ service",
          "Children's parties: £150–£350 including themed music and simple lighting",
          "School proms: £400–£800 including sound, lighting, and MC",
        ],
      },
      {
        heading: "What affects the price?",
        content: [
          "Experience level: DJs with years of weddings and large events typically charge more than newer DJs",
          "Event duration: most DJs quote for a standard 4 or 5-hour set; extra hours are charged on top",
          "Equipment provided: some DJs bring a full PA system and lighting rig; others expect the venue to provide",
          "Travel distance: most Essex DJs include travel within a 30km radius; longer distances incur a travel supplement",
          "Time of year: peak wedding season (May–September) and December often attract higher rates",
          "Additional services: photo booths, LED uplighting, and dance floors are often add-ons",
        ],
      },
      {
        heading: "What should a DJ quote include?",
        content: [
          "Total hours of performance",
          "Set up and pack down time (this should not eat into your paid performance time)",
          "Equipment provided (PA, mixer, lighting)",
          "Whether an MC service is included",
          "Travel costs and any fuel surcharges",
          "Whether music requests are accommodated before and during the event",
        ],
      },
      {
        heading: "Questions to ask before booking",
        content: [
          "Are you available on my date, and is this confirmed?",
          "Do you have public liability insurance (this is required by most venues)?",
          "Can I provide a do-not-play list and a list of must-play tracks?",
          "What happens if you are ill or have an emergency on the day?",
          "Do you have a written contract we will both sign?",
          "How much is the deposit, and what is your cancellation policy?",
        ],
      },
      {
        heading: "Red flags to watch out for",
        content: [
          "DJs who cannot provide proof of public liability insurance",
          "No written contract: verbal agreements are difficult to enforce",
          "Very low quotes with no explanation of what is excluded",
          "Requests for full payment upfront before the event",
          "No reviews or only unverified social media comments",
        ],
      },
      {
        heading: "Why book through ELBOLD instead of social media?",
        content:
          "Every DJ on ELBOLD has been manually reviewed by our team before listing. We check portfolio quality, business identity, and professionalism. Your 30% deposit is held securely by Stripe and only released after your event, so you never pay upfront with no protection.",
      },
    ],
    faqs: [
      {
        q: "Do I pay the DJ upfront?",
        a: "When booking through ELBOLD, you pay a 30% deposit to confirm the booking. The deposit is held securely by Stripe until after your event. Do not pay any vendor in full upfront.",
      },
      {
        q: "How far in advance should I book a DJ in Essex?",
        a: "For weddings and large events, 6–12 months in advance is typical. For private parties, 2–3 months is usually sufficient, though popular DJs book up quickly during summer.",
      },
      {
        q: "Do DJs supply their own sound system?",
        a: "Most mobile DJs bring their own PA system and lighting. Always confirm this in writing before booking. Some DJs assume the venue provides a PA.",
      },
    ],
    ctaHref: "/essex/djs",
    ctaLabel: "Browse DJs in Essex",
    relatedSlugs: ["wedding-planning-checklist-uk", "birthday-party-planning-guide"],
  },
  {
    slug: "wedding-planning-checklist-uk",
    title: "Wedding Planning Checklist UK",
    description:
      "A step-by-step wedding planning checklist for UK couples, from 12 months out to the day before. Know what to book and when.",
    category: "Weddings",
    publishedDate: "2026-06-01",
    readingMinutes: 8,
    heroTag: "Wedding Guide",
    intro:
      "Planning a wedding in the UK involves dozens of moving parts across 12 months or more. This checklist breaks down what to do and when, so nothing gets left until the last minute.",
    sections: [
      {
        heading: "12 months before",
        content: [
          "Agree a total budget and track all spending from day one",
          "Set your preferred date and a backup date",
          "Agree your approximate guest list size",
          "Choose your venue and confirm availability",
          "Book your registrar or celebrant (registrars in England and Wales book up early)",
          "Start researching photographers, as they are often the first to go",
          "Book your photographer once you have visited and reviewed portfolios",
        ],
      },
      {
        heading: "9–12 months before",
        content: [
          "Book your caterer if the venue does not provide in-house catering",
          "Book your DJ or live band",
          "Start researching wedding dresses or suits. Allow time for alterations.",
          "Book hair and make-up artists",
          "Research florists and request quotes",
          "Start a wedding website to share key information with guests",
        ],
      },
      {
        heading: "6–9 months before",
        content: [
          "Send save-the-date cards to all guests",
          "Book the wedding cake",
          "Choose your wedding party and ask them officially",
          "Arrange accommodation for out-of-town guests",
          "Research and book a videographer if required",
          "Book transport for the day",
          "Start planning your honeymoon and check passport validity",
        ],
      },
      {
        heading: "3–6 months before",
        content: [
          "Send formal invitations with RSVP deadlines",
          "Book any additional entertainment: photo booth, magician, caricaturist",
          "Confirm all vendor bookings and contracts",
          "Research wedding insurance. It is worth the investment.",
          "Plan the ceremony order of service",
          "Arrange wedding favours",
          "Confirm dietary requirements with your caterer",
        ],
      },
      {
        heading: "1–3 months before",
        content: [
          "Confirm final guest numbers with all vendors",
          "Create a detailed day timeline and share it with all vendors",
          "Arrange all licences required (bar licence, entertainment licence)",
          "Confirm the order of first dance, speeches, and cutting of cake",
          "Book a final dress fitting",
          "Arrange a rehearsal if you have a complex ceremony",
        ],
      },
      {
        heading: "Week of the wedding",
        content: [
          "Confirm arrival times with all vendors",
          "Prepare a contact sheet with every vendor's phone number",
          "Prepare an emergency kit (safety pins, stain remover, spare stockings)",
          "Delegate the vendor contact role to a trusted person on the day",
          "Prepare payment for any vendors paid on the day",
          "Get a good night's sleep",
        ],
      },
    ],
    faqs: [
      {
        q: "What should I book first for a UK wedding?",
        a: "Book your venue and registrar first, as they fill up earliest, especially for Saturday dates. Your photographer and caterer should follow immediately after.",
      },
      {
        q: "How much does a wedding cost in the UK?",
        a: "The average UK wedding costs £20,000–£30,000, though this varies enormously based on location, guest numbers, and choices. Weddings in London tend to cost more than those in the East of England or Midlands.",
      },
      {
        q: "Should I get wedding insurance?",
        a: "Yes. Wedding insurance typically costs £100–£300 and covers you if a key supplier becomes insolvent, a venue closes unexpectedly, or extreme weather forces postponement. It is money well spent.",
      },
    ],
    ctaHref: "/browse",
    ctaLabel: "Browse Wedding Vendors",
    relatedSlugs: ["how-to-choose-a-photographer", "how-much-does-a-dj-cost-in-essex"],
  },
  {
    slug: "how-to-choose-a-photographer",
    title: "How to Choose a Wedding or Event Photographer",
    description:
      "A practical guide to finding and hiring the right photographer for your wedding, birthday, or event, including what to look for in portfolios, contracts, and prices.",
    category: "Photography",
    publishedDate: "2026-06-01",
    readingMinutes: 7,
    heroTag: "Photography Guide",
    intro:
      "Photographs are one of the few things that last from your event for decades. Choosing the right photographer is one of the most important decisions you will make. This guide helps you make it confidently.",
    sections: [
      {
        heading: "Understand your style preferences before you search",
        content: [
          "Documentary / reportage: natural, candid, minimal posing. Events captured as they happen.",
          "Traditional: posed family groups, structured shots, reliable coverage of all key moments.",
          "Fine art: artistic, often moody, high-end editing. More about mood than documentation.",
          "Mixed approach: most photographers offer a blend of all three. Ask them to describe their style.",
        ],
      },
      {
        heading: "What to look for in a portfolio",
        content: [
          "Full event galleries, not just highlights (highlights are curated to show only the best shots)",
          "Photos from a similar type of event to yours (wedding, birthday, corporate)",
          "Consistency across the whole gallery, not just a handful of perfect images",
          "Good low-light photography if your event involves evening coverage",
          "The ability to capture candid emotion: laughing, crying, interaction",
          "Final editing style: do the colours and tone match what you want?",
        ],
      },
      {
        heading: "Questions to ask a photographer",
        content: [
          "Have you shot at my venue before? (They may have useful knowledge of lighting and layout)",
          "How many images will I receive, and how long until I receive them?",
          "How will the images be delivered (USB, online gallery, print)?",
          "Do you have a second photographer or backup plan if you are ill?",
          "Do you have public liability insurance?",
          "What is your cancellation policy and what happens to my deposit?",
        ],
      },
      {
        heading: "Understanding pricing",
        content: [
          "Half-day coverage (4 hours): £400–£900",
          "Full day coverage (8–10 hours): £900–£2,500 for a wedding",
          "Portrait or birthday shoot (2–3 hours): £200–£500",
          "Albums and prints: usually charged separately. Confirm whether these are included.",
          "Second photographer: often £150–£350 additional",
        ],
      },
      {
        heading: "Contract essentials",
        content: [
          "Date, venue, and hours of coverage clearly stated",
          "Exact number of edited images to be delivered",
          "Delivery timeframe (typically 4–8 weeks for weddings)",
          "Cancellation terms: what happens if you or they need to cancel",
          "Who owns the copyright: most photographers retain copyright but license images to you",
          "Whether the photographer may use images in their portfolio",
        ],
      },
    ],
    faqs: [
      {
        q: "How far in advance should I book a photographer?",
        a: "For weddings, 9–12 months is advisable. Experienced photographers in popular months (May–September) fill up very early. For parties and corporate events, 2–3 months is usually sufficient.",
      },
      {
        q: "Do I need a second photographer?",
        a: "For weddings, a second photographer is highly recommended. They can cover the bride and groom getting ready simultaneously and capture moments the main photographer misses. For smaller events, one is usually sufficient.",
      },
      {
        q: "What if I am not happy with my photos?",
        a: "Discuss your concerns with the photographer first. If the issue is genuine (poor focus, missing key moments), a formal dispute through your booking platform may result in a partial refund. Artistic differences (where photos are technically good but not to your personal taste) are harder to resolve contractually, which is why reviewing a full gallery before booking is so important.",
      },
    ],
    ctaHref: "/browse",
    ctaLabel: "Browse Photographers",
    relatedSlugs: ["wedding-planning-checklist-uk", "birthday-party-planning-guide"],
  },
  {
    slug: "birthday-party-planning-guide",
    title: "Birthday Party Planning Guide",
    description:
      "Everything you need to plan a memorable birthday party: from setting the budget to booking vendors and creating the timeline.",
    category: "Parties",
    publishedDate: "2026-06-01",
    readingMinutes: 6,
    heroTag: "Party Planning",
    intro:
      "Whether you are planning a 30th, a 50th, a children's party, or a surprise celebration, the basics of good party planning are the same. This guide walks you through the key decisions.",
    sections: [
      {
        heading: "Start with three decisions",
        content: [
          "Budget: set a maximum before you begin. Everything else flows from this.",
          "Guest list: approximate numbers determine your venue size and catering requirements.",
          "Date: allow yourself at least 6–8 weeks for planning a medium-sized event.",
        ],
      },
      {
        heading: "Choosing a venue",
        content: [
          "Private hire rooms at restaurants or bars (often the simplest option, catering included)",
          "Village or community halls (lower cost, full flexibility, you arrange everything)",
          "Garden marquee hire (great for summer, requires more coordination)",
          "Activity venues: bowling, escape rooms, pottery studios (built-in entertainment)",
          "Always ask: what is included in the hire fee? Is there a bar? Is there a noise curfew?",
        ],
      },
      {
        heading: "Entertainment options",
        content: [
          "DJ: suitable for all ages, most flexible option for large gatherings",
          "Live band: higher cost but high impact for milestone birthdays",
          "Magician or close-up magic: works brilliantly during the drinks reception",
          "Photo booth: excellent for keeping guests engaged and providing a keepsake",
          "Children's parties: soft play, entertainers, face painters, and themed activities",
        ],
      },
      {
        heading: "Catering choices",
        content: [
          "Buffet: most flexible, works for mixed dietary requirements",
          "Bowl food: modern alternative to a sit-down meal, works well for standing parties",
          "Afternoon tea: elegant option for milestone birthdays",
          "Street food van: increasingly popular for garden parties and informal events",
          "Always confirm dietary requirements when guests RSVP",
        ],
      },
      {
        heading: "Timeline: 8 weeks before",
        content: [
          "Book the venue",
          "Set the date and send save-the-dates",
          "Book entertainment (DJ, band, or activity)",
          "Book catering if not provided by the venue",
          "Order the birthday cake",
        ],
      },
      {
        heading: "Timeline: 2 weeks before",
        content: [
          "Chase RSVPs and confirm final numbers",
          "Create a day timeline and share with all vendors",
          "Arrange decorations",
          "Confirm arrival and setup times with all vendors",
        ],
      },
    ],
    faqs: [
      {
        q: "How much does a birthday party cost in the UK?",
        a: "Small home parties can be done for under £200. Medium venue events for 30–50 people typically cost £500–£1,500. Large events with DJ, catering, and entertainment can reach £3,000–£8,000 or more.",
      },
      {
        q: "Should I hire a party planner?",
        a: "For events under 30 people, a planner is rarely necessary. For larger events or if you have limited time, a part-day coordinator can save significant stress on the day.",
      },
    ],
    ctaHref: "/browse",
    ctaLabel: "Browse Party Vendors",
    relatedSlugs: ["how-much-does-a-dj-cost-in-essex", "how-to-choose-a-photographer"],
  },
  {
    slug: "corporate-event-planning-checklist",
    title: "Corporate Event Planning Checklist",
    description:
      "A complete checklist for planning corporate events in the UK: team days, conferences, product launches, and client dinners.",
    category: "Corporate",
    publishedDate: "2026-06-01",
    readingMinutes: 7,
    heroTag: "Corporate Events",
    intro:
      "Corporate events require tighter logistics and clearer objectives than private events. Whether you are planning a team away day, a conference, or a product launch, this checklist covers the essentials.",
    sections: [
      {
        heading: "Define the objective before anything else",
        content: [
          "Team building and morale: the event should feel rewarding, not obligatory",
          "Product or service launch: requires AV, staging, and precise run-of-show",
          "Client entertainment: focus on quality, exclusivity, and smooth service",
          "Conference or training: logistics, seating, and AV are critical",
          "Your objective determines your venue type, catering style, and entertainment needs",
        ],
      },
      {
        heading: "Venue selection",
        content: [
          "Capacity: always book a venue slightly larger than your headcount",
          "AV capabilities: does the venue have in-house AV, or do you need to hire it?",
          "Parking and transport links",
          "Accessibility for all attendees",
          "Catering: in-house, exclusive caterer, or bring your own?",
          "Licences: are they licensed for alcohol, entertainment, and late events?",
        ],
      },
      {
        heading: "Vendors you may need",
        content: [
          "AV company (sound, screens, lighting, livestream if required)",
          "Photographer and/or videographer",
          "Caterer (arrival canapes, lunch, dinner depending on duration)",
          "DJ or live entertainment for the evening",
          "Master of ceremonies (MC) for conferences and structured events",
          "Branded merchandise supplier",
        ],
      },
      {
        heading: "Budget considerations",
        content: [
          "Always build a 10–15% contingency into the budget",
          "Get itemised quotes from all vendors. Avoid package deals that obscure individual costs.",
          "Clarify what VAT is applicable to and whether it is included in quotes",
          "Confirm payment terms: many vendors require 50% deposit on booking",
        ],
      },
      {
        heading: "Communications and logistics",
        content: [
          "Send calendar invitations with all relevant details",
          "Create a detailed run-of-show document and share with all vendors",
          "Nominate an on-site point of contact for all vendor queries on the day",
          "Confirm dietary requirements for all attendees",
          "Prepare a briefing document for any speakers or MCs",
        ],
      },
      {
        heading: "On the day",
        content: [
          "Arrive early to supervise setup",
          "Confirm arrival times with all vendors the evening before",
          "Have printed copies of the run-of-show for key team members",
          "Designate a person to manage registration",
          "Collect feedback from attendees before they leave",
        ],
      },
    ],
    faqs: [
      {
        q: "How far in advance should corporate events be planned?",
        a: "Large conferences and award ceremonies: 6–12 months. Team away days and client dinners: 2–3 months minimum. Leaving less time significantly limits your venue and vendor options.",
      },
      {
        q: "Do we need public liability insurance for a corporate event?",
        a: "You do not typically need to arrange your own. Most venues have their own PLI and most vendors have their own policies. Always ask for proof of public liability insurance from every vendor before confirming.",
      },
    ],
    ctaHref: "/browse",
    ctaLabel: "Browse Corporate Event Vendors",
    relatedSlugs: ["wedding-planning-checklist-uk", "birthday-party-planning-guide"],
  },
];

export function getGuide(slug: string): Guide | undefined {
  return GUIDES.find((g) => g.slug === slug);
}

export function getRelatedGuides(slugs: string[]): Guide[] {
  return GUIDES.filter((g) => slugs.includes(g.slug));
}
