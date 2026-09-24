export interface Quote {
  text: string;
  author: string;
}

/** A pool of business and motivation quotes; one is shown per day, so the page feels fresh without any API. */
export const QUOTES: Quote[] = [
  { text: 'The way to get started is to quit talking and begin doing.', author: 'Walt Disney' },
  { text: 'Well done is better than well said.', author: 'Benjamin Franklin' },
  { text: "Whether you think you can, or you think you can't, you're right.", author: 'Henry Ford' },
  { text: 'Success is the sum of small efforts, repeated day in and day out.', author: 'Robert Collier' },
  { text: 'Price is what you pay. Value is what you get.', author: 'Warren Buffett' },
  { text: 'Your most unhappy customers are your greatest source of learning.', author: 'Bill Gates' },
  { text: 'Innovation distinguishes between a leader and a follower.', author: 'Steve Jobs' },
  { text: "Don't watch the clock; do what it does. Keep going.", author: 'Sam Levenson' },
  { text: "Opportunities don't happen. You create them.", author: 'Chris Grosser' },
  { text: 'If you want to go fast, go alone. If you want to go far, go together.', author: 'African proverb' },
  { text: 'A journey of a thousand miles begins with a single step.', author: 'Lao Tzu' },
  { text: 'Fall seven times, stand up eight.', author: 'Japanese proverb' },
  { text: 'Small deeds done are better than great deeds planned.', author: 'Peter Marshall' },
  { text: 'Discipline is the bridge between goals and accomplishment.', author: 'Jim Rohn' },
  { text: 'Great things are done by a series of small things brought together.', author: 'Vincent van Gogh' },
  { text: 'The only place where success comes before work is in the dictionary.', author: 'Vidal Sassoon' },
  { text: 'Excellence is doing ordinary things extraordinarily well.', author: 'John W. Gardner' },
  { text: 'Efficiency is doing things right; effectiveness is doing the right things.', author: 'Peter Drucker' },
  { text: "The customer's perception is your reality.", author: 'Kate Zabriskie' },
  { text: 'Slow and steady wins the race.', author: 'Aesop' },
  { text: 'Start where you are. Use what you have. Do what you can.', author: 'Arthur Ashe' },
  { text: "Perseverance is not a long race; it is many short races one after the other.", author: 'Walter Elliot' },
  { text: "Don't count the days, make the days count.", author: 'Muhammad Ali' },
  { text: 'The harder I work, the luckier I get.', author: 'Samuel Goldwyn' },
  { text: 'Quality means doing it right when no one is looking.', author: 'Henry Ford' },
  { text: 'Waste not, want not.', author: 'Proverb' },
  { text: "Rome wasn't built in a day.", author: 'Proverb' },
  { text: 'A satisfied customer is the best business strategy of all.', author: 'Michael LeBoeuf' },
  { text: 'Every great business is built on friendship.', author: 'J. C. Penney' },
  { text: 'Focus on being productive instead of busy.', author: 'Tim Ferriss' },
];

/** The same quote all day, a different one tomorrow (cycles through the list by calendar day). */
export function quoteForDate(date: Date): Quote {
  const dayNumber = Math.floor(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86_400_000);
  return QUOTES[dayNumber % QUOTES.length];
}
