export const otrProfile = (id: number) => `https://otr.stagec.xyz/players/${id}`;

export const otrMatch = (id: number) => `https://otr.stagec.xyz/matches/${id}`;

export const tierToRoman = (tier: number) => {
  switch (tier) {
    case 1:
      return 'I';
    case 2:
      return 'II';
    default:
      return 'III';
  }
};
