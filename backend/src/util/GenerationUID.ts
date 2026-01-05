export function generateUID(): string {
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

  // 3 ký tự in hoa
  let prefix = "";
  for (let i = 0; i < 3; i++) {
    prefix += letters.charAt(Math.floor(Math.random() * letters.length));
  }

  // 5 chữ số
  let numbers = "";
  for (let i = 0; i < 5; i++) {
    numbers += Math.floor(Math.random() * 10).toString();
  }

  return prefix + numbers;
}

export function generateRoomUID(): string {
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

  // 3 ký tự in hoa
  let prefix = "";
  for (let i = 0; i < 3; i++) {
    prefix += letters.charAt(Math.floor(Math.random() * letters.length));
  }

  // 5 chữ số
  let numbers = "";
  for (let i = 0; i < 5; i++) {
    numbers += Math.floor(Math.random() * 10).toString();
  }

  return "room_" + prefix + numbers;
}

export function generateUserUID(): string {
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

  // 3 ký tự in hoa
  let prefix = "";
  for (let i = 0; i < 3; i++) {
    prefix += letters.charAt(Math.floor(Math.random() * letters.length));
  }

  // 5 chữ số
  let numbers = "";
  for (let i = 0; i < 5; i++) {
    numbers += Math.floor(Math.random() * 10).toString();
  }

  return "USER_" + prefix + numbers;
}





