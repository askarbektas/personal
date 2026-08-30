/* ============================================================
   THE STORY — the only file you edit.

   One block per memory. Order does not matter; the page sorts
   everything by date.

     date    'YYYY-MM-DD'
     title   a short heading
     by      'askar' | 'asem' | omit for a shared moment
     text    paragraphs, as an array of strings
     place   optional. Where it happened
     quote   optional. { text: '...', by: 'asem' }
     photos  optional. [{ src: 'file.jpg', caption: '...' }]
             src is read from the photos/ folder

   A date in the future is drawn as an open knot on a dashed
   thread, labelled today / tomorrow / in N days.

   Milestones (one month, 100 days, a year …) are worked out
   from startDate and appear on their own. Do not add them.
   ============================================================ */

const SITE = {
  title:     'Us',
  subtitle:  'Askar and Asem',
  startDate: '2026-08-18',
  tail:      'To be continued.',

  names: {
    askar: 'Askar',
    asem:  'Asem'
  },

  opening: {
    arabic:  'هُوَ الَّذِي خَلَقَكُم مِّن نَّفْسٍ وَاحِدَةٍ وَجَعَلَ مِنْهَا زَوْجَهَا لِيَسْكُنَ إِلَيْهَا',
    meaning: 'It is He who created you from a single soul, and made from it its companion — so that he might find his rest in her.',
    ref:     'Al-A‘rāf 7:189',
    note:    'A rendering of the meaning, written for this page.'
  }
};

const STORY = [

  {
    date:  '2026-08-18',
    title: 'The first message',
    by:    'askar',
    text: [
      'This is the day we started writing to each other.'
    ],
    photos: []
  },

  {
    date:  '2026-08-30',
    title: 'Two weeks',
    text: [
      'So far it already feels like we are each other’s people.'
    ],
    photos: []
  },

  {
    date:  '2026-08-31',
    title: 'The first time we meet',
    text: [],
    photos: []
  }

];
