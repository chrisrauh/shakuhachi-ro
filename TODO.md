1| # TODO - Shakuhachi Score Library Platform
2| 
3| This file tracks active tasks for the shakuhachi score library platform. Complete tasks in order, complete one task at a time, check if the task hasn't already been implemented, finish a task befor[...]
4| 
5| **Goal:** Transform shakuhachi-ro into a collaborative platform where users can create, share, and fork shakuhachi scores.
6| **Plan:** See implementation plan in session transcript
7| 
8| ## Platform MVP - Current Tasks
9| 
10| ## Remaining Tasks
11| 
12| ## Remove feature bloat
13| 
14| - [x] Remove tagging feature
15| - [ ] Remove views feature
16| - [ ] Remove creator's profile feature
17| - [ ] Remove difficulty rating
18| 
19| ### Phase 7: User Profile
20| 
21| - [ ] Create profile.html page (URL: /profile.html?id=<user-id>)
22| - [ ] Display user's scores in grid
23| - [ ] Show username/email
24| - [ ] Link to each score
25| - [ ] Add edit/delete buttons (if own profile)
26| - [ ] Implement getUserScores(userId) query
27| - [ ] Add "My Scores" link in navigation
28| - [ ] Test: View own profile, view other user's profile
29| 
30| ### Phase 8: Navigation & UI Polish
31| 
32| - [ ] Create site header component (logo, navigation)
33| - [ ] Add navigation links: Home | Create Score | My Scores | Profile
34| - [ ] Add auth UI: Login/Signup or Username/Logout
35| - [ ] Create footer with attribution
36| - [ ] Add consistent styling (CSS framework or custom)
37| - [ ] Implement responsive design (mobile, tablet, desktop)
38| - [ ] Add loading spinners and error states
39| - [ ] Polish form validation and error messages
40| - [ ] Test across browsers (Chrome, Firefox, Safari)
41| 
42| ## Renderer Enhancements (Future)
43| 
44| - [ ] Add score selector dropdown
45| - [ ] Load different score files dynamically
46| - [ ] Add JSDoc comments to public APIs
47| - [ ] Write usage guide in references/README.md
48| - [ ] Document score data format
49| 
50| ### Additional Modifiers
51| 
52| - [ ] YuriModifier (vibrato)
53| - [ ] MuraikiModifier (breathy tone)
54| - [ ] SuriModifier (sliding)
55| - [ ] OriModifier (pitch bend)
56| - [ ] Centered duration line style (line passes horizontally through middle of note, alternative to current right-aligned style)
57| 
58| ### Performance & Optimization
59| 
60| - [ ] Profile rendering performance
61| - [ ] Optimize frequent operations
62| - [ ] Add caching where appropriate
63| - [ ] Revisit column breaking with TeX-inspired badness algorithm
64|   - [ ] Implement badness metric for column height variance
65|   - [ ] Add demerits for orphans (single notes in columns)
66|   - [ ] Add penalties for breaking at certain notation points
67|   - [ ] Implement global optimization across score (Knuth-Plass approach)
68| 
69| ### Advanced Features (Post-MVP)
70| 
71| - [ ] Visual score editor (point-and-click note entry)
72| - [ ] OCR tool (scan physical scores to MusicXML/JSON)
73| - [ ] Collections (curated score groups)
74| - [ ] Version history (track edits over time)
75| - [ ] Comments/discussions on scores
76| - [ ] Pull request workflow (suggest changes to others' scores)
77| - [ ] Private scores (unlisted or private visibility)
78| - [ ] Export/download scores as files
79| - [ ] Print optimization (CSS for clean printouts)
80| - [ ] Advanced search (filter by tags, difficulty, date ranges)
81| - [ ] Multiple score input formats (import from ABC, etc.)
82| - [ ] MIDI playback mapping
83| - [ ] Western staff intermixing
84| - [ ] Custom font support for traditional glyphs
85| - [ ] Score transposition tool
86| 