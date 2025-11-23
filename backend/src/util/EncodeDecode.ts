import bcrypt from 'bcrypt';


async function encodePassword(password: string) {
    const saltRounds = 10;
    const passwordEncoded = await bcrypt.hash(password, saltRounds);
    return passwordEncoded
}


export { encodePassword }