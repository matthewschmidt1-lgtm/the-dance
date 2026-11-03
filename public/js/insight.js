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
    'change-order': {
      options: {
        A: { buys: ['calm', 'time'], verdict: { who: 'luis', line: `Approved it fast. Easy client.` } },
        B: { buys: ['right', 'win'], verdict: { who: 'luis', line: `Held me to the bid and ignored the contract. I pulled my crew.` } },
        C: { buys: ['info', 'fair'], verdict: { who: 'luis', line: `Read the contract and looked at the floor. Respect.` } },
        D: { buys: ['info'], verdict: { who: 'luis', line: `Wanted a second opinion. Fair, but it cost us both three weeks.` } },
        E: { buys: ['win'], verdict: { who: 'luis', line: `Threatened a one-star review over rotten plywood. I won't forget it.` } },
        F: { buys: ['fair', 'time'], verdict: { who: 'luis', line: `Approved it on the spot with a cap and the contract clause. Knew what they were doing.` } }
      }
    },
    'the-offer': {
      options: {
        A: { buys: ['calm', 'liked'], verdict: { who: 'sam', line: `Easiest close of the quarter.` } },
        B: { buys: ['win'], verdict: { who: 'alicia', line: `Mentioned an offer they couldn't show us. That stuck with me.` } },
        C: { buys: ['info', 'fair', 'future'], verdict: { who: 'alicia', line: `Knew our range and our deadline, and was straight with us. Easy yes.` } },
        D: { buys: ['win', 'right'], verdict: { who: 'sam', line: `Gave us an ultimatum above our posted ceiling. Bold.` } },
        E: { buys: ['time'], verdict: { who: 'sam', line: `Asked for more time. Didn't do much with it.` } },
        F: { buys: ['info', 'fair', 'future'], verdict: { who: 'sam', line: `Asked for something I could approve on the spot, plus a path to more. Easy yes.` } }
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
