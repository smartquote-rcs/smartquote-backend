import bcrypt from "bcrypt";

export async function passwordHash(senha:string) {
  const saltRounds = 10;
  const hash = await bcrypt.hash(senha, saltRounds);
  return hash;
}