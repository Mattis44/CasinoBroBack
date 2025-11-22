import { IUser } from "../interfaces/IUser";
import { v4 as uuidv4 } from "uuid";
import { User } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

export async function getAllUsers() {
    return prisma.user.findMany();
}

export async function getUserById(id: string): Promise<User | null> {
  return prisma.user.findUnique({
    where: { id_user: id },
  });
}

export async function getUsersBySearch(search: string, limit = 10) {
  return prisma.user.findMany({
    where: {
      OR: [
        { str_username: { contains: search } },
        { str_email: { contains: search } },
      ],
    },
    take: limit,
  });
}


export async function getUserByUsername(username: string) {
  console.log(username);
  
  if (!username) return null;
  return prisma.user.findUnique({
    where: { str_username: username },
  });
}

export async function isAdminById(id: string) {
  const user = await prisma.user.findUnique({
    where: { id_user: id },
    select: { bl_admin: true },
  });

  return user?.bl_admin ?? false;
}


export async function createUser(user: IUser) {
  const id = uuidv4();

  console.log("a user",  user);
  

  try {
    const created = await prisma.user.create({
      data: {
        id_user: id,
        str_username: user.str_username,
        str_email: user.str_email,
        str_password: user.str_password,
        bl_admin: Boolean(user.bl_admin),
      },
    });

    return created;

  } catch (err: any) {
    console.log(err);
    
    if (err.code === "P2002") {
      // Prisma code: unique constraint failed
      return getUserByUsername(user.str_username);
    }
    throw err;
  }
}

export async function updateUser(user: IUser) {
  return prisma.user.update({
    where: { id_user: user.id_user },
    data: {
      str_username: user.str_username,
      str_password: user.str_password,
    },
  });
}
