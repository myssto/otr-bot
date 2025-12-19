export const otrProfile = (id: number) => `https://otr.stagec.xyz/players/${id}`;

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
