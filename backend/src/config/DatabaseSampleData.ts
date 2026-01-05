import { encodePassword } from "../util/EncodeDecode";

export const SAMPLE_DATA = {
  DEFAULT_USER: {
    username: 'user1',
    email: 'user1@gmail.com',
    password: 'Aq123456.',
    passwordEncoded: encodePassword('Aq123456.')
  },
  
  DEFAULT_MAIN_USER: {
    name_in_game: 'The First Player',
    status: 0,
    location: '',
    avatar_url: '',
    phone: '0198209831',
    bio: 'The first user of the game platform'
  }
};