export interface Sticker {
  id: string;
  emoji: string;
  label: string;
  category: string;
}

export const STICKER_CATEGORIES = [
  "Love", "Birthday", "Holiday", "Celebration", "Nature", "Animals", "Food", "Symbols", "Faces", "Travel"
];

export const STICKERS: Sticker[] = [
  // Love
  { id: "heart-red", emoji: "❤️", label: "Red Heart", category: "Love" },
  { id: "heart-pink", emoji: "💗", label: "Growing Heart", category: "Love" },
  { id: "heart-sparkle", emoji: "💖", label: "Sparkling Heart", category: "Love" },
  { id: "heart-arrow", emoji: "💘", label: "Cupid Heart", category: "Love" },
  { id: "heart-ribbon", emoji: "💝", label: "Gift Heart", category: "Love" },
  { id: "heart-double", emoji: "💕", label: "Two Hearts", category: "Love" },
  { id: "heart-revolve", emoji: "💞", label: "Revolving Hearts", category: "Love" },
  { id: "kiss-mark", emoji: "💋", label: "Kiss Mark", category: "Love" },
  { id: "couple-heart", emoji: "💑", label: "Couple", category: "Love" },
  { id: "love-letter", emoji: "💌", label: "Love Letter", category: "Love" },
  { id: "rose", emoji: "🌹", label: "Rose", category: "Love" },
  { id: "bouquet", emoji: "💐", label: "Bouquet", category: "Love" },

  // Birthday
  { id: "cake", emoji: "🎂", label: "Birthday Cake", category: "Birthday" },
  { id: "party-popper", emoji: "🎉", label: "Party Popper", category: "Birthday" },
  { id: "confetti", emoji: "🎊", label: "Confetti Ball", category: "Birthday" },
  { id: "balloon", emoji: "🎈", label: "Balloon", category: "Birthday" },
  { id: "gift", emoji: "🎁", label: "Gift Box", category: "Birthday" },
  { id: "candle", emoji: "🕯️", label: "Candle", category: "Birthday" },
  { id: "party-hat", emoji: "🥳", label: "Party Face", category: "Birthday" },
  { id: "sparkler", emoji: "🎇", label: "Sparkler", category: "Birthday" },

  // Holiday
  { id: "christmas-tree", emoji: "🎄", label: "Christmas Tree", category: "Holiday" },
  { id: "santa", emoji: "🎅", label: "Santa", category: "Holiday" },
  { id: "snowman", emoji: "⛄", label: "Snowman", category: "Holiday" },
  { id: "snowflake", emoji: "❄️", label: "Snowflake", category: "Holiday" },
  { id: "pumpkin", emoji: "🎃", label: "Pumpkin", category: "Holiday" },
  { id: "ghost", emoji: "👻", label: "Ghost", category: "Holiday" },
  { id: "fireworks", emoji: "🎆", label: "Fireworks", category: "Holiday" },
  { id: "menorah", emoji: "🕎", label: "Menorah", category: "Holiday" },

  // Celebration
  { id: "trophy", emoji: "🏆", label: "Trophy", category: "Celebration" },
  { id: "medal", emoji: "🥇", label: "Gold Medal", category: "Celebration" },
  { id: "crown", emoji: "👑", label: "Crown", category: "Celebration" },
  { id: "sparkles", emoji: "✨", label: "Sparkles", category: "Celebration" },
  { id: "star", emoji: "⭐", label: "Star", category: "Celebration" },
  { id: "glowing-star", emoji: "🌟", label: "Glowing Star", category: "Celebration" },
  { id: "clapping", emoji: "👏", label: "Clapping", category: "Celebration" },
  { id: "thumbs-up", emoji: "👍", label: "Thumbs Up", category: "Celebration" },

  // Nature
  { id: "sun", emoji: "☀️", label: "Sun", category: "Nature" },
  { id: "moon", emoji: "🌙", label: "Moon", category: "Nature" },
  { id: "rainbow", emoji: "🌈", label: "Rainbow", category: "Nature" },
  { id: "cloud", emoji: "☁️", label: "Cloud", category: "Nature" },
  { id: "lightning", emoji: "⚡", label: "Lightning", category: "Nature" },
  { id: "fire", emoji: "🔥", label: "Fire", category: "Nature" },
  { id: "water-drop", emoji: "💧", label: "Water Drop", category: "Nature" },
  { id: "cherry-blossom", emoji: "🌸", label: "Cherry Blossom", category: "Nature" },
  { id: "sunflower", emoji: "🌻", label: "Sunflower", category: "Nature" },
  { id: "four-leaf", emoji: "🍀", label: "Four Leaf Clover", category: "Nature" },

  // Animals
  { id: "butterfly", emoji: "🦋", label: "Butterfly", category: "Animals" },
  { id: "unicorn", emoji: "🦄", label: "Unicorn", category: "Animals" },
  { id: "cat-face", emoji: "🐱", label: "Cat", category: "Animals" },
  { id: "dog-face", emoji: "🐶", label: "Dog", category: "Animals" },
  { id: "paw", emoji: "🐾", label: "Paw Prints", category: "Animals" },
  { id: "dove", emoji: "🕊️", label: "Dove", category: "Animals" },

  // Food
  { id: "pizza", emoji: "🍕", label: "Pizza", category: "Food" },
  { id: "ice-cream", emoji: "🍦", label: "Ice Cream", category: "Food" },
  { id: "donut", emoji: "🍩", label: "Donut", category: "Food" },
  { id: "coffee", emoji: "☕", label: "Coffee", category: "Food" },
  { id: "wine", emoji: "🍷", label: "Wine", category: "Food" },
  { id: "cocktail", emoji: "🍸", label: "Cocktail", category: "Food" },

  // Symbols
  { id: "peace", emoji: "☮️", label: "Peace", category: "Symbols" },
  { id: "yin-yang", emoji: "☯️", label: "Yin Yang", category: "Symbols" },
  { id: "infinity", emoji: "♾️", label: "Infinity", category: "Symbols" },
  { id: "music-note", emoji: "🎵", label: "Music Note", category: "Symbols" },
  { id: "diamond", emoji: "💎", label: "Diamond", category: "Symbols" },
  { id: "magic-wand", emoji: "🪄", label: "Magic Wand", category: "Symbols" },
  { id: "evil-eye", emoji: "🧿", label: "Evil Eye", category: "Symbols" },
  { id: "lotus", emoji: "🪷", label: "Lotus", category: "Symbols" },

  // Faces
  { id: "smile", emoji: "😊", label: "Smile", category: "Faces" },
  { id: "heart-eyes", emoji: "😍", label: "Heart Eyes", category: "Faces" },
  { id: "cool", emoji: "😎", label: "Cool", category: "Faces" },
  { id: "wink", emoji: "😉", label: "Wink", category: "Faces" },
  { id: "laugh", emoji: "😂", label: "Laugh", category: "Faces" },
  { id: "angel", emoji: "😇", label: "Angel", category: "Faces" },

  // Travel
  { id: "airplane", emoji: "✈️", label: "Airplane", category: "Travel" },
  { id: "palm-tree", emoji: "🌴", label: "Palm Tree", category: "Travel" },
  { id: "camera", emoji: "📸", label: "Camera", category: "Travel" },
  { id: "world", emoji: "🌍", label: "World", category: "Travel" },
  { id: "compass", emoji: "🧭", label: "Compass", category: "Travel" },
  { id: "tent", emoji: "⛺", label: "Tent", category: "Travel" },
];
