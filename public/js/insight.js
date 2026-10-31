// What the game notices about the player.
//   buys     what each choice pursues (Seykota: everybody gets what they want)
//   verdict  how the person most affected would describe you after that choice
window.PP = window.PP || {};

PP.insight = {
  tags: {
    info:   `Knowing more`,
    fair:   `A fair deal`,
    future: `The long game`,
    right:  `Being right`,
    win:    `Winning the round`,
    liked:  `Being liked`,
    calm:   `Avoiding friction`,
    time:   `Protecting your time`
  },

  scenes: {
    'wrong-price': {
      options: {
        A: { buys: ['right', 'win'], verdict: { who: 'maya', line: `Fair enough, I guess. Everyone in line was staring at me.` } },
        B: { buys: ['calm', 'time'], verdict: { who: 'maya', line: `Nice customer. Didn't seem to care about the price.` } },
        C: { buys: ['info', 'fair', 'future'], verdict: { who: 'maya', line: `Made my job easy. I'd help them again in a heartbeat.` } },
        D: { buys: ['win', 'right'], verdict: { who: 'maya', line: `Went straight over my head. I could have fixed it.` } },
        E: { buys: ['info', 'calm'], verdict: { who: 'maya', line: `Patient. Sorted it out without making it my problem.` } }
      }
    },
    'just-this-once': {
      options: {
        A: { buys: ['liked', 'calm'], verdict: { who: 'dana', line: `Always says yes. I probably lean on that too much.` } },
        B: { buys: ['time'], verdict: { who: 'dana', line: `Guarded. Fair, I suppose. I didn't expect a flat no.` } },
        C: { buys: ['info', 'fair', 'future'], verdict: { who: 'dana', line: `Asked the right question. We worked it out like adults.` } },
        D: { buys: ['fair', 'time'], verdict: { who: 'dana', line: `Wanted something back, which is fair. Then it got stuck with Ellen.` } },
        E: { buys: ['liked', 'future'], verdict: { who: 'dana', line: `Meant well. Put me on the spot in front of Ellen, though.` } }
      }
    },
    'the-spot': {
      options: {
        A: { buys: ['right', 'win'], verdict: { who: 'gary', line: `Left me a note in my third week. Noted.` } },
        B: { buys: ['info', 'future', 'fair'], verdict: { who: 'gary', line: `Good neighbor. Asked before assuming.` } },
        C: { buys: ['win', 'right'], verdict: { who: 'gary', line: `Parked in front of my house one day. Still not sure why.` } },
        D: { buys: ['calm'], verdict: { who: 'gary', line: `Never said a word. Seemed nice enough.` } },
        E: { buys: ['win', 'right'], verdict: { who: 'gary', line: `Posted about me before we'd even said hello. Hard to forget.` } }
      }
    },
    'credit-taker': {
      options: {
        A: { buys: ['right', 'win'], verdict: { who: 'jordan', line: `Called me out in front of everyone. I deserved some of it.` } },
        B: { buys: ['fair', 'future'], verdict: { who: 'jordan', line: `Gave me a chance to fix it quietly. I owe them one.` } },
        C: { buys: ['info', 'fair', 'future'], verdict: { who: 'ellen', line: `Knows that analysis better than anyone in the room.` } },
        D: { buys: ['fair', 'future'], verdict: { who: 'ellen', line: `Brought me the file history, calmly. I noticed.` } },
        E: { buys: ['calm'], verdict: { who: 'jordan', line: `Didn't say anything. I figured it didn't matter to them.` } }
      }
    },
    'pick-a-side': {
      options: {
        A: { buys: ['liked', 'win'], verdict: { who: 'marcus', line: `Picked a side. Not mine.` } },
        B: { buys: ['calm', 'liked'], verdict: { who: 'priya', line: `Went with rank over evidence. I stopped asking for their view.` } },
        C: { buys: ['calm'], verdict: { who: 'ellen', line: `I'm sure they had a view. They didn't share it.` } },
        D: { buys: ['fair', 'future', 'info'], verdict: { who: 'ellen', line: `Turned a fight into a decision I could actually make.` } },
        E: { buys: ['win', 'info'], verdict: { who: 'marcus', line: `Repeats things. Good to know.` } }
      }
    },
    'the-fence': {
      options: {
        A: { buys: ['liked', 'calm'], verdict: { who: 'gary', line: `Generous. Maybe too generous.` } },
        B: { buys: ['win', 'time'], verdict: { who: 'gary', line: `Wouldn't chip in. I remember that every time I look at the oak.` } },
        C: { buys: ['fair', 'future'], verdict: { who: 'gary', line: `Fair to a fault. Best neighbor on the street.` } },
        D: { buys: ['calm'], verdict: { who: 'gary', line: `Still waiting on an answer. I stopped asking.` } },
        E: { buys: ['fair'], verdict: { who: 'gary', line: `Brought Ruth into it. Worked out, mostly.` } }
      }
    },
    'change-order': {
      options: {
        A: { buys: ['calm', 'time'], verdict: { who: 'luis', line: `Approved it fast. Easy client.` } },
        B: { buys: ['right', 'win'], verdict: { who: 'luis', line: `Held me to the bid and ignored the contract. I pulled my crew.` } },
        C: { buys: ['info', 'fair'], verdict: { who: 'luis', line: `Read the contract and looked at the floor. Respect.` } },
        D: { buys: ['info'], verdict: { who: 'luis', line: `Wanted a second opinion. Fair, but it cost us both three weeks.` } },
        E: { buys: ['win'], verdict: { who: 'luis', line: `Threatened a one-star review over rotten plywood. I won't forget it.` } }
      }
    },
    'the-offer': {
      options: {
        A: { buys: ['calm', 'liked'], verdict: { who: 'sam', line: `Easiest close of the quarter.` } },
        B: { buys: ['win'], verdict: { who: 'alicia', line: `Mentioned an offer they couldn't show us. That stuck with me.` } },
        C: { buys: ['info', 'fair', 'future'], verdict: { who: 'alicia', line: `Knew our range and our deadline, and was straight with us. Easy yes.` } },
        D: { buys: ['win', 'right'], verdict: { who: 'sam', line: `Gave us an ultimatum above our posted ceiling. Bold.` } },
        E: { buys: ['time'], verdict: { who: 'sam', line: `Asked for more time. Didn't do much with it.` } }
      }
    }
  },

  // What each top pursuit tends to cost or earn, in Seykota's spirit. Said plainly, once.
  buyNotes: {
    info:   `You kept buying information before you moved. It's an edge most people skip.`,
    fair:   `Your choices kept buying fair deals. That's what makes people want to deal with you again.`,
    future: `You played for the next round more than this one. That compounds.`,
    right:  `Being right came up more than anything else. Proving it can get very expensive.`,
    win:    `Winning the round came first more often than not. The rounds kept coming.`,
    liked:  `Your choices kept buying approval. It's pleasant, and people learn they can lean on it.`,
    calm:   `Avoiding friction is what your choices bought most. Quiet now can turn into louder later.`,
    time:   `You guarded your time well. Watch that it doesn't harden into a reflex no.`
  },

  // One question to carry out, from the player's weakest measure.
  questions: {
    str: `Before your next hard conversation, what will the other person most likely do after you speak?`,
    reg: `The next time you feel certain and in a hurry, what would it cost to wait one beat?`,
    inc: `Who in your week wants something you haven't asked them about?`,
    neg: `Where are you treating a "yes, if" as a plain yes or no?`,
    com: `What could you say this week that makes it easy for someone to help you?`,
    lng: `Which relationship are you treating as a one-time deal when it isn't?`,
    coo: `Where is there a version of a current disagreement where you both come out ahead?`,
    bnd: `What limit have you been meaning to say out loud?`,
    inf: `What's one thing you're about to decide that you could check first in a minute?`,
    jdg: `Which recent success of yours was partly luck, and what would you do the same if it hadn't been?`
  }
};
