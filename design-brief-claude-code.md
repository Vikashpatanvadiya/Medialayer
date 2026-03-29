# AI Design Skill Brief — Design Brief

> Build-ready design skill brief for Claude Code
> Tool: **Claude Code**
> Save this as a markdown file in your project and reference it in Claude Code to match this design language.

---

## Overall Read

Modern and organized. Utilizes a clean aesthetic with a focus on content presentation and easy navigation. The overall impression is professional yet approachable.. The interface conveys a Productive and user-friendly. The design aims to make users feel supported and capable of managing their tasks and interactions efficiently. mood. Type: app.

## Layout Archetype

Dashboard. Fixed left sidebar for global navigation. Top horizontal bar for search and account management. Main content area using a flexible grid layout to showcase content cards and promotional messages.. Density: Medium. Key information is visible without extensive scrolling, but sufficient spacing is provided to prevent visual clutter, creating a balance between content visibility and visual comfort..

## Information Flow

Content flows from a prominent introductory message at the top to a horizontally scrolling/grid-based display of content cards below, organized by categories ('Inspiration from the Loom Community').

## Spacing Rhythm

A consistent increment of 8px or 16px. Content cards are roughly 24px apart. The left navigation items have vertical spacing of 16px-24px. The top bar elements are well-spaced, suggesting 24-32px padding on the horizontal axis. Body text and headings maintain a clear line height for readability.. Section separation: Sections are primarily separated by generous vertical white space (e.g., 48px to 64px between the 'Work's always better together' section and 'Inspiration from the Loom Community'). A horizontal rule is not explicitly used, relying on spacing and clear headings..

## Navigation Behavior

Global fixed left sidebar navigation with icon-based links. A top bar provides secondary navigation and utility actions.. Visibility: Always visible (persistent left sidebar and top bar).. Depth: Primarily shallow, with most primary actions accessible directly from the main icons. Sub-navigation is implied to be handled within the content area if selected.. Utility actions: Top right corner of the top bar for account settings, upgrade, and profile. Bottom left of the sidebar for quick recording access..

## Card & Surface Treatment

Surfaces: White background with a subtle shadow, giving them a floating effect. This uniformity across cards enhances consistency.. Borders: Consistent 8px border-radius applied globally to buttons, search input fields, and content cards. This creates a softer, more approachable look.. Shadows: Subtle box shadows are used on content cards (e.g.,  `box-shadow: 0px 4px 8px rgba(0, 0, 0, 0.1)`) to elevate them from the background and imply interactivity or distinct content blocks. The top bar also has a subtle shadow to separate it visually.. Container separation: Primarily white space, combined with subtle shadows for cards. The left sidebar is also delineated by a vertical shadow or a subtle border to separate it from the main content..

## Component Recurrence

- Vertical navigation icons
- Search input field
- Primary (filled) buttons
- Secondary (outlined) buttons
- Content cards with media thumbnails
- Metadata labels
- Avatar/profile icons
- Notification badges

Recurrence: High recurrence of content cards, navigation icons, and buttons throughout the interface, ensuring a consistent user experience.. Consistency: Highly consistent. All instances of a component type (e.g., primary buttons, content cards) share the same visual styling, proportions, and interactive behaviors, reinforcing the design system's integrity..

## CTA Hierarchy

Primary: Solid filled purple button with white text and 8px border-radius (e.g., 'Send an invite', 'Upgrade'). These stand out significantly.. Secondary: Implied through text links (e.g., 'Loom Community') or potentially ghost buttons (not explicitly visible but likely to follow an outlined style). The overall design prioritizes clear primary calls to action.. Frequency: Moderate. CTAs are strategically placed where user action is desired (e.g., inviting teammates, upgrading, playing a video).. Emphasis: High emphasis on primary CTAs through bold color and placement, guiding the user towards key actions. Secondary actions are less visually prominent, often relying on text links..

## Information Density

Medium. While individual cards contain a fair amount of information, the overall layout prevents overwhelming the user by using clear separation and ample white space.

## Typography System

Sans-serif, uniform, and highly legible. Emphasizes clarity and modern aesthetics.. Headings: Bold, darker text for primary headings (e.g., 'Work's always better together' is ~28px, bold, #333). Section headings (e.g., 'Inspiration from...') are slightly smaller (~20px, bold, #333).. Body: Regular weight, slightly lighter gray text for body content and descriptions (e.g., 'Add teammates...' is ~16px, #6C757D). Metadata (e.g., '3 years', '0') is even lighter and smaller (~12-14px).. Hierarchy strength: Strong. Clearly differentiates between primary headings, secondary headings, body text, and metadata through variations in font size, weight, and color contrast, ensuring easy readability and scanability..

## Color Strategy

Monochromatic base (white, various shades of gray for text) with a primary accent color (purple) and a secondary alert color (red).. Accent behavior: Purple is consistently used for interactive elements like buttons, active navigation states, and links. It provides a clear visual cue for interactability. Red is reserved for notifications and potentially error states.. Contrast: High contrast for text against backgrounds (dark text on white) to ensure readability. Moderate contrast for accent elements to make them stand out without being jarring. Uses sufficient contrast to meet accessibility standards..

## Interaction Style

Direct and intuitive. Elements like navigation icons and buttons are clearly clickable. Hover states provide immediate visual feedback.. Hover feedback: For navigation icons, a purple background appears on hover. For buttons, a slight color change or lift is expected. Cards may also show a subtle shadow increase or border highlight.. Motion intensity: Subtle. Likely employs soft transitions for hover states or state changes rather than prominent animations, focusing on functional feedback rather than decorative motion. (Not explicitly visible in static screenshot but implied by modern UI practices)..

## Data Visualization

Minimal. Primarily text-based display of counts (e.g., views, comments, reactions). Video thumbnails are the main visual content type.. Chart style: N/A - no complex charts or graphs are visible in this view.. Data density: Low to medium. Key metrics (video length, engagement counts) are concisely displayed within content cards..

## Build Guidance

Collaboration platforms, content management systems, internal communication tools, educational portals.

## Avoid

Designs requiring extremely high information density on a single screen (e.g., financial trading dashboards) or interfaces where visual flair outweighs function.

## Do Not Copy

Do not reproduce the exact layout, brand identity, or copy from the source design.
Use the extracted design language only as inspiration for creating a new interface.
