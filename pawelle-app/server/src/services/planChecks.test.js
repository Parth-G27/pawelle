import { describe, expect, it } from 'vitest'
import { allergenMatcher, checkPlan, checkSummary, countEmoji, normalisePlan, sanitizeText, trimSummary } from './planChecks.js'

const base = {
  summary: "Pinky is feeling happy today, so let's keep the good vibes going!",
  meals: [{ time: 'morning', amount: 'usual', reason: 'routine' }],
  play: [{ idea: 'feather_wand', minutes: 10, reason: 'short_bursts' }],
}
const ctx = { name: 'Pinky', allergies: [], conditions: [], lifeStage: 'adult', energy: 'normal', mood: 'happy', appetite: 'normal', hasCheckin: true }
const check = (patch = {}, c = {}) => checkPlan({ ...base, ...patch }, { ...ctx, ...c })

describe('sanitizeText', () => {
  it('strips markup and markdown', () => {
    expect(sanitizeText('<b>Hi</b> **Pinky**, `hello`')).toBe('Hi Pinky, hello')
    expect(sanitizeText('<script>alert(1)</script>Hello')).toBe('alert(1) Hello')
  })
  it('keeps at most three emoji (AC20)', () => {
    const out = sanitizeText('Hi 🐾 there 😸 friend ❤️ wow 🎉 yes 🌟')
    expect(countEmoji(out)).toBe(3)
  })
})

describe('summary checks', () => {
  it('rejects links and addresses (AC27)', () => {
    for (const t of ['See https://example.com for more', 'Visit www.catfood.net', 'try catblog.org today', 'Read this (link)[http://x.y]']) {
      expect(checkSummary(t)).toContain('link')
    }
  })
  it('rejects sources, certainty claims and brands (AC27)', () => {
    expect(checkSummary('According to studies, cats love routines')).toContain('source')
    expect(checkSummary('This will definitely cure boredom')).toEqual(expect.arrayContaining(['certainty']))
    expect(checkSummary('Pinky will love Whiskas today')).toContain('brand')
    expect(checkSummary('Try some Royal Canin')).toContain('brand')
  })
  it('rejects medicine, doses and diagnosis words (AC12)', () => {
    expect(checkSummary('Give a small dose of medicine')).toContain('medicine')
    expect(checkSummary('That could be an infection')).toContain('diagnosis')
    expect(checkSummary('Some paracetamol will help')).toContain('medicine')
  })
  it('allows diagnosis words that match the owner\'s own conditions', () => {
    expect(checkSummary('Remember the kidney disease diet advice from your vet', { conditions: ['Kidney disease'] })).toEqual([])
    expect(checkSummary('Remember the kidney disease diet advice from your vet', { conditions: [] })).toContain('diagnosis')
  })
  it('rejects made-up numbers but allows minutes (AC5)', () => {
    expect(checkSummary('Feed 50 grams of food')).toContain('numbers')
    expect(checkSummary('About 200 kcal is perfect')).toContain('numbers')
    expect(checkSummary('That is $5 well spent')).toContain('numbers')
    expect(checkSummary('A calm 10 minute play session')).toEqual([])
  })
  it('passes a friendly summary', () => {
    expect(checkSummary("Pinky is feeling happy today, so let's keep the good vibes going! 🐾")).toEqual([])
  })
})

describe('allergens (AC10)', () => {
  it('matches the allergy, plurals, and aliases', () => {
    const fish = allergenMatcher(['Fish'])
    for (const t of ['fish dinner', 'a little salmon', 'tuna time', 'some sardines']) expect(fish.test(t), t).toBe(true)
    const dairy = allergenMatcher(['dairy'])
    for (const t of ['a splash of milk', 'cheese bits', 'cream']) expect(dairy.test(t), t).toBe(true)
    expect(allergenMatcher(['chicken']).test('some poultry')).toBe(true)
    expect(allergenMatcher(['eggs']).test('a boiled egg')).toBe(true)
    expect(allergenMatcher(['grains']).test('rice and wheat')).toBe(true)
  })
  it('matches custom allergies literally, whole words only', () => {
    expect(allergenMatcher(['turkey']).test('turkey slices')).toBe(true)
    expect(allergenMatcher(['rice']).test('a nice day')).toBe(false)
    expect(allergenMatcher([])).toBeNull()
    expect(allergenMatcher(null)).toBeNull()
  })
  it('fails a plan whose summary names a listed allergen', () => {
    const r = check({ summary: 'Pinky loves a little salmon treat today, so lovely!' }, { allergies: ['Fish'] })
    expect(r.ok).toBe(false)
    expect(r.problems).toContain('allergen')
  })
  it('passes when there is no allergy', () => {
    expect(check({ summary: 'Pinky loves a little salmon treat today, so lovely!' }).ok).toBe(true)
  })
})

describe('checkPlan', () => {
  it('passes a good plan and returns the repaired plan', () => {
    const r = check()
    expect(r.ok).toBe(true)
    expect(r.plan.meals).toHaveLength(1)
  })
  it('flags a bad shape', () => {
    expect(checkPlan({ summary: 'short' }, ctx)).toEqual({ ok: false, plan: null, problems: ['shape'] })
    expect(checkPlan(null, ctx).problems).toEqual(['shape'])
    expect(check({ play: [{ idea: 'bungee', minutes: 10, reason: 'short_bursts' }] }).problems).toEqual(['shape'])
  })
  it('sanitises the summary it returns', () => {
    const r = check({ summary: '**Pinky** is feeling <i>happy</i> today, lovely!' })
    expect(r.plan.summary).toBe('Pinky is feeling happy today, lovely!')
  })
})

describe('normalisePlan (repair)', () => {
  const plan = (m, p) => ({ summary: base.summary, meals: m, play: p })
  const meal = (time, amount = 'usual', reason = 'routine') => ({ time, amount, reason })
  const play = (idea, minutes = 10, reason = 'short_bursts') => ({ idea, minutes, reason })

  it('caps an adult at two meals, in time order, no duplicate times', () => {
    const r = normalisePlan(plan([meal('evening'), meal('morning'), meal('morning'), meal('midday')], [play('feather_wand')]), ctx)
    expect(r.meals.map((m) => m.time)).toEqual(['morning', 'evening']) // a grown-up cat's two meals
    expect(normalisePlan(plan([meal('morning'), meal('midday'), meal('evening')], [play('feather_wand')]), { ...ctx, lifeStage: 'kitten' }).meals).toHaveLength(3)
  })
  it('never allows "a little more" when appetite is low or with a weight condition', () => {
    const m = [meal('morning', 'a_little_more')]
    expect(normalisePlan(plan(m, [play('feather_wand')]), { ...ctx, appetite: 'low' }).meals[0].amount).toBe('usual')
    expect(normalisePlan(plan(m, [play('feather_wand')]), { ...ctx, conditions: ['Overweight'] }).meals[0].amount).toBe('usual')
    expect(normalisePlan(plan(m, [play('feather_wand')]), ctx).meals[0].amount).toBe('usual') // an ordinary day: no extra
    expect(normalisePlan(plan(m, [play('feather_wand')]), { ...ctx, appetite: 'great' }).meals[0].amount).toBe('a_little_more')
    expect(normalisePlan(plan(m, [play('feather_wand')]), { ...ctx, lifeStage: 'kitten' }).meals[0].amount).toBe('a_little_more')
    const twice = [meal('morning', 'a_little_more'), meal('evening', 'a_little_more')]
    expect(normalisePlan(plan(twice, [play('feather_wand')]), { ...ctx, appetite: 'great' }).meals.map((x) => x.amount)).toEqual(['a_little_more', 'usual'])
  })
  it('replaces reasons that do not fit this cat', () => {
    const r = normalisePlan(plan([meal('morning', 'usual', 'small_meals')], [play('feather_wand', 10, 'gentle_senior')]), ctx)
    expect(r.meals[0].reason).toBe('routine')
    expect(r.play[0].reason).toBe('short_bursts')
    const low = normalisePlan(plan([meal('morning', 'usual', 'two_meals')], [play('feather_wand')]), { ...ctx, appetite: 'low', lifeStage: 'senior' })
    expect(low.meals[0].reason).toBe('gentle_appetite')
  })
  it('drops repeated and too-energetic play, snaps and caps minutes', () => {
    const tired = normalisePlan(plan([meal('morning')], [play('climbing', 20), play('window_watching', 30), play('window_watching', 20)]), { ...ctx, energy: 'sleepy' })
    expect(tired.play.map((p) => p.idea)).toEqual(['window_watching'])
    expect(tired.play[0].minutes).toBe(10)
    const senior = normalisePlan(plan([meal('morning')], [play('tunnel', 20), play('feather_wand', 22)]), { ...ctx, lifeStage: 'senior' })
    expect(senior.play).toEqual([{ idea: 'feather_wand', minutes: 15, reason: 'short_bursts' }])
    expect(normalisePlan(plan([meal('morning')], [play('feather_wand', 7)]), ctx).play[0].minutes).toBe(5)
  })
  it('always keeps at least one play idea', () => {
    const r = normalisePlan(plan([meal('morning')], [play('climbing')]), { ...ctx, energy: 'sleepy' })
    expect(r.play).toEqual([{ idea: 'feather_wand', minutes: 10, reason: 'short_bursts' }])
  })
  it('only uses the "energy match" reason when there is a check-in', () => {
    const p = plan([meal('morning')], [play('feather_wand', 10, 'energy_match')])
    expect(normalisePlan(p, ctx).play[0].reason).toBe('energy_match')
    expect(normalisePlan(p, { ...ctx, hasCheckin: false }).play[0].reason).toBe('short_bursts')
  })
})

describe('trimSummary', () => {
  it('keeps up to two complete sentences within 200 characters', () => {
    expect(trimSummary('Pinky is happy today! Let us play. And one more sentence here.')).toBe('Pinky is happy today! Let us play.')
  })
  it('drops a trailing half sentence', () => {
    expect(trimSummary('Pinky is happy today! She is settling into a comfortable routine and')).toBe('Pinky is happy today!')
  })
  it('cuts a single very long sentence at a word with an ellipsis', () => {
    const long = `Pinky is feeling ${'wonderfully '.repeat(30)}happy`
    const out = trimSummary(long)
    expect(out.length).toBeLessThanOrEqual(200)
    expect(out.endsWith('…')).toBe(true)
  })
  it('is applied to what the owner sees', () => {
    const r = checkPlan({ ...base, summary: 'Pinky is feeling wonderful today! Pinky is settling into a comfortable routine and' }, ctx)
    expect(r.plan.summary).toBe('Pinky is feeling wonderful today!')
  })
})

describe('trimming cannot hide a problem', () => {
  it('rejects a link even when it sits in the part that would be cut', () => {
    const r = checkPlan({ ...base, summary: 'Pinky is happy today! Read more at www.catblog.com for lots of tips.' }, ctx)
    expect(r.ok).toBe(false)
    expect(r.problems).toContain('link')
  })
  it('rejects a link in the middle of a sentence', () => {
    const r = checkPlan({ ...base, summary: 'Pinky, read more at www.catblog.com today!' }, ctx)
    expect(r.problems).toContain('link')
  })
  it('rejects an allergen mentioned after the kept sentences', () => {
    const r = checkPlan({ ...base, summary: 'Pinky is happy today! A treat. And then a little salmon later on.' }, { ...ctx, allergies: ['Fish'] })
    expect(r.problems).toContain('allergen')
  })
})

describe('the cat\'s name is always used (voice rule)', () => {
  it('opens with the name when the model forgot it', () => {
    const r = checkPlan({ ...base, summary: 'It is a lovely day for a little nap and some gentle play.' }, ctx)
    expect(r.plan.summary).toBe("Here's today's plan for Pinky! It is a lovely day for a little nap and some gentle play.")
  })
  it('leaves a summary that already uses the name alone', () => {
    expect(checkPlan({ ...base, summary: 'Pinky is enjoying a cosy day!' }, ctx).plan.summary).toBe('Pinky is enjoying a cosy day!')
  })
})

describe('summary repair (voice rules)', () => {
  const c = (extra) => ({ ...ctx, sex: null, lifeStage: 'adult', ...extra })
  it('drops sentences with he or she when the owner did not say the cat\'s sex, keeping the rest', () => {
    const r = checkPlan({ ...base, summary: 'Pinky is happy today! She is playful and cheerful. Let us have fun together.' }, c())
    expect(r.ok).toBe(true)
    expect(r.plan.summary).toBe('Pinky is happy today! Let us have fun together.')
  })
  it('keeps the matching pronoun and drops the other', () => {
    expect(checkPlan({ ...base, summary: 'Pinky is happy today! She is playful.' }, c({ sex: 'female' })).plan.summary).toBe('Pinky is happy today! She is playful.')
    expect(checkPlan({ ...base, summary: 'Pinky is happy today! He is playful.' }, c({ sex: 'female' })).plan.summary).toBe('Pinky is happy today!')
    expect(checkPlan({ ...base, summary: 'Gus is calm today! She is playful.' }, c({ name: 'Gus', sex: 'male' })).plan.summary).toBe('Gus is calm today!')
  })
  it('drops "kitten" for a grown cat and "senior" for a young one', () => {
    expect(checkPlan({ ...base, summary: 'Pinky the kitten is happy! Lovely day ahead for Pinky.' }, c()).plan.summary).toBe('Lovely day ahead for Pinky.')
    expect(checkPlan({ ...base, summary: 'Mochi is a happy kitten today! Playtime is the best.' }, c({ name: 'Mochi', lifeStage: 'kitten' })).plan.summary).toContain('kitten')
    expect(checkPlan({ ...base, summary: 'Gus is a lovely senior cat! Cosy day ahead for Gus.' }, c({ name: 'Gus', lifeStage: 'senior' })).plan.summary).toContain('senior')
  })
  it('drops sentences about the time of day, since the model does not know it', () => {
    expect(checkPlan({ ...base, summary: 'Pinky is happy! It is a lovely afternoon for a nap.' }, c()).plan.summary).toBe('Pinky is happy!')
  })
  it('asks for a retry only when nothing usable is left', () => {
    const r = checkPlan({ ...base, summary: 'She is such a happy girl today.' }, c())
    expect(r).toEqual({ ok: false, plan: null, problems: ['wording'] })
  })
  it('does not trip on words that merely contain he or her', () => {
    expect(checkPlan({ ...base, summary: 'Pinky and the sheet of paper, whether together or not!' }, c()).ok).toBe(true)
  })
})
