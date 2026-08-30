/* ============================================================
   HIKOYA — bu yagona fayl, siz shuni tahrirlaysiz.

   Har bir xotira uchun bitta blok qo'shasiz. Tartib muhim emas —
   sayt sanaga qarab o'zi joylashtiradi.

   date   — 'YYYY-MM-DD'
   title  — qisqa sarlavha
   text   — bitta yoki bir nechta xatboshi (massiv)
   photos — ixtiyoriy. 'photos/' papkasidagi fayl nomlari
   quote  — ixtiyoriy. Kimningdir aynan aytgan gapi
   by     — quote kimniki: 'asem' yoki 'askar'

   Kelasi sanani yozsangiz, sayt uni "hali bo'lmagan" deb
   ko'rsatadi va ip uzilmay davom etadi.
   ============================================================ */

const SITE = {
  title:      'Biz',
  subtitle:   'Askar va Asem',
  startDate:  '2026-08-18',

  // Ochilish oyati — siz so'ragan 7:189
  opening: {
    arabic:  'هُوَ الَّذِي خَلَقَكُم مِّن نَّفْسٍ وَاحِدَةٍ وَجَعَلَ مِنْهَا زَوْجَهَا لِيَسْكُنَ إِلَيْهَا',
    meaning: 'U sizlarni bir jondan yaratdi va undan juftini qildi — toki uning yonida orom topsin.',
    ref:     'Al-A‘rof, 7:189',
    note:    'Ma’no tarjimasi shu sahifa uchun yozilgan.'
  }
};

const STORY = [

  {
    date:  '2026-08-18',
    title: 'Birinchi xabar',
    text: [
      'Shu kuni yozishni boshladik.'
    ],
    // quote: '', by: 'asem',
    photos: []
  },

  {
    date:  '2026-08-30',
    title: 'Ikki hafta',
    text: [
      'Hozircha bir-birimizni odamlarimizdek sezyapmiz.'
    ],
    photos: []
  },

  {
    date:  '2026-08-31',
    title: 'Birinchi ko‘rishuv',
    text: [
      'Bu yerni ko‘rishgandan keyin to‘ldirasiz.'
    ],
    photos: []
  }

];
