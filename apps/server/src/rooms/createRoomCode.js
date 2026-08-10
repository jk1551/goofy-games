const CHARACTERS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function createRoomCode(length = 4, random = Math.random) {
  return Array.from({ length }, () => {
    const index = Math.floor(random() * CHARACTERS.length);
    return CHARACTERS[index];
  }).join("");
}
